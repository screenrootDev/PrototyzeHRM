<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIAgentService
{
    private array $blockedTables = [
        'settings', 'personal_access_tokens', 'password_reset_tokens',
        'cache', 'cache_locks', 'sessions', 'jobs', 'job_batches',
        'failed_jobs', 'migrations', 'model_has_permissions',
        'model_has_roles', 'role_has_permissions', 'login_histories',
    ];

    private array $blockedColumns = [
        'password', 'remember_token', 'api_key', 'ai_api_key', 'secret',
        'token', 'stripe_key', 'stripe_secret', 'card_number',
        'card_exp_month', 'card_exp_year', 'txn_id', 'receipt',
        'account_number', 'bank_identifier_code', 'tax_payer_id',
    ];

    // Main entry point
    public function chat(string $message, array $history, User $user): array
    {
        $context = $this->buildContext($user);
        $plan    = $this->planQuery($message, $context, $history);
        $result  = $this->executeQuery($plan, $user, $context);
        $reply   = $this->formatResponse($message, $result, $history);

        return ['reply' => $reply, 'intent' => $result['intent']];
    }

    // Build database context
    private function buildContext(User $user): array
    {
        $permissions = $this->getUserPermissions($user);
        $schema      = $this->getCachedSchema();

        return [
            'schema'      => $schema,
            'permissions' => $permissions,
            'modules'     => [],
            'user_id'     => $user->id,
            'creator_id'  => creatorId(),
        ];
    }

    // Get user permissions
    private function getUserPermissions(User $user): array
    {
        return array_values(array_filter(
            $user->getAllPermissions()->pluck('name')->toArray(),
            fn($p) => str_starts_with($p, 'manage-')
        ));
    }

    // Get cached schema
    private function getCachedSchema(): array
    {
        return Cache::remember('ai_agent_schema', 86400, function () {
            return $this->scanDatabase();
        });
    }

    // Scan database for tables and columns
    private function scanDatabase(): array
    {
        $dbName = env('DB_DATABASE');
        $tables = DB::select('SHOW TABLES');
        $schema = [];
        $tablesWithCreatedBy = [];

        // First pass: tables with created_by
        foreach ($tables as $tableRow) {
            $table = $tableRow->{"Tables_in_{$dbName}"};
            if (in_array($table, $this->blockedTables)) continue;
            
            $columns = Schema::getColumnListing($table);
            if (in_array('created_by', $columns)) {
                $tablesWithCreatedBy[] = $table;
                $schema[$table] = [
                    'columns' => array_values(array_diff($columns, $this->blockedColumns)),
                    'is_child' => false,
                ];
            }
        }

        // Second pass: child tables (no created_by, linked via FK)
        $childTables = $this->discoverChildTables($tablesWithCreatedBy);
        foreach ($childTables as $table => $relation) {
            $columns = Schema::getColumnListing($table);
            $schema[$table] = [
                'columns' => array_values(array_diff($columns, $this->blockedColumns)),
                'is_child' => true,
                'parent' => $relation['parent'],
                'fk' => $relation['fk'],
            ];
        }

        return $schema;
    }

    // Auto-discover child tables via foreign keys
    private function discoverChildTables(array $tablesWithCreatedBy): array
    {
        $dbName = env('DB_DATABASE');
        $fks = DB::select("
            SELECT TABLE_NAME as child_table, COLUMN_NAME as fk_column, REFERENCED_TABLE_NAME as parent_table
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL AND REFERENCED_COLUMN_NAME = 'id'
        ", [$dbName]);

        $fkMap = [];
        foreach ($fks as $fk) {
            $fkMap[$fk->child_table][] = ['fk' => $fk->fk_column, 'parent' => $fk->parent_table];
        }

        $childTables = [];
        foreach ($fkMap as $childTable => $relations) {
            if (in_array($childTable, $tablesWithCreatedBy)) continue;
            if (in_array($childTable, $this->blockedTables)) continue;
            if (!Schema::hasTable($childTable)) continue;

            foreach ($relations as $rel) {
                if (in_array($rel['parent'], $tablesWithCreatedBy)) {
                    $childTables[$childTable] = ['parent' => $rel['parent'], 'fk' => $rel['fk']];
                    break;
                }
            }
        }

        return $childTables;
    }

    // Ask AI to plan the query
    private function planQuery(string $message, array $context, array $history): array
    {
        $config = $this->getAIConfig();
        
        if (!$config) {
            return ['intent' => 'api_error', 'message' => __('AI Agent is not configured.')];
        }

        $systemPrompt = $this->buildSystemPrompt($context, $history, $message);

        try {
            $response = $this->callAI($config['provider'], $config['model'], $config['api_key'], $systemPrompt);
            $plan     = $this->parseAIResponse($response);
            
            return $plan && isset($plan['intent']) ? $plan : ['intent' => 'out_of_scope'];
        } catch (\Exception $e) {
            return ['intent' => 'api_error', 'message' => $this->formatError($e->getMessage())];
        }
    }

    // Get AI configuration
    private function getAIConfig(): ?array
    {
        $provider = getSetting('ai_agent_provider');
        $model    = getSetting('ai_agent_model');
        $apiKey   = getSetting('ai_agent_api_key');

        if (!$provider || !$model || !$apiKey) {
            return null;
        }

        return [
            'provider' => $provider,
            'model'    => $model,
            'api_key'  => $apiKey,
        ];
    }

    // Build system prompt
    private function buildSystemPrompt(array $context, array $history, string $message): string
    {
        $tablesJson      = json_encode(array_keys($context['schema']));
        $permissionsJson = json_encode($context['permissions']);
        $modulesJson     = json_encode($context['modules']);
        $historyJson     = json_encode(array_slice($history, -6));

        $systemPrompt = <<<SYSTEM
You are an ERP query planner. Return JSON query plans.

MODULES: {$modulesJson}
PERMISSIONS: {$permissionsJson}
TABLES: {$tablesJson}

TABLE SCHEMAS:
- employees: employee_id, date_of_birth, gender, date_of_joining, employment_type, user_id, branch_id, department_id, designation_id
- attendance_records: employee_id, date, clock_in, clock_out, total_hour, status
- leave_applications: employee_id, leave_type_id, start_date, end_date, total_days, status, applied_on
- expenses: expense_number, expense_date, category_id, amount, status (pending/approved/rejected)
- users: name, email, mobile_no, type, status

QUERY RULES:
1. Determine the intent: "data_query", "chart_query", "action", or "out_of_scope".
2. Identify the target table and required columns.
3. Determine any filters needed based on the user's question (e.g., date ranges, status).
4. If aggregate is asked (e.g., total, count), provide aggregate function and column.
5. If the question is unrelated to HR data → return intent: "out_of_scope".
6. Never include these columns in select: password, remember_token, token, secret, api_key, card_number, account_number, bank_identifier_code, tax_payer_id.
7. Always use standard SQL formats for dates (YYYY-MM-DD) or keywords (today, this_week, this_month, this_year).
8. Output ONLY a valid JSON object matching the examples.
9. For "on leave today" or similar date range queries, use start_date: "<=today" AND end_date: ">=today" as two separate filter entries.
10. For date comparisons (before/after/greater/less), use operators: ">", "<", ">=", "<=", "=".
11. For multiple filters on the same column, return as array: {"column": [{"operator": ">=", "value": "2024-01-01"}, {"operator": "<=", "value": "2024-12-31"}]}.
12. Always include relevant identifier columns in select (invoice_number, proposal_number, name, employee_id, etc.).
13. Return ONLY valid JSON, no markdown, no explanations.

AGGREGATES:
- SUM for: total/revenue/amount/value/price/budget → {"function":"SUM","column":"total_amount"} or "price" or "value"
- COUNT for: how many/count/number of → {"function":"COUNT","column":"*"}
- AVG for: average → {"function":"AVG","column":"total_amount"}

LIST QUERIES (aggregate: null):
- employees → select: ["employee_id","user_id","date_of_joining","employment_type"]
- attendance_records → select: ["employee_id","date","status","total_hour"]
- leave_applications → select: ["employee_id","start_date","end_date","status","total_days"]
- expenses → select: ["expense_number","amount","status","expense_date"]

DATE FILTERS:
- this_year, this_month, today for date columns
- Use date for attendance_records, start_date for leave_applications, expense_date for expenses

STATUS FILTERS:
- Leaves: pending, approved, rejected
- Attendance: present, absent, half day, late
- Tickets: open, closed, resolved, in progress

COMMON QUERIES:
- "who is on leave" → leave_applications where status = approved (and date filters)
- "pending leaves" → leave_applications where status = pending
- "today attendance" → attendance_records where date = today
- "employee list" → employees (no filters needed)
- "active users" → users where status = active

EXAMPLES:
{"intent":"data_query","table":"employees","select":["employee_id","user_id","date_of_joining","employment_type"],"filters":{},"aggregate":null}
{"intent":"data_query","table":"attendance_records","select":["employee_id","status","date"],"filters":{"date":"today"},"aggregate":null}
{"intent":"data_query","table":"leave_applications","select":["employee_id","start_date","end_date","status"],"filters":{"status":"pending"},"aggregate":null}
{"intent":"data_query","table":"leave_applications","select":["employee_id","start_date","end_date","status"],"filters":{"start_date":"<=today","end_date":">=today"},"aggregate":null}

HISTORY: {$historyJson}
QUESTION: "{$message}"
SYSTEM;

        return $systemPrompt;
    }

    // Parse AI response
    private function parseAIResponse(string $response): ?array
    {
        $response = trim(preg_replace('/^```[a-z]*\n?/i', '', preg_replace('/```$/', '', $response)));
        return json_decode($response, true);
    }

    // Call AI provider
    private function callAI(string $provider, string $model, string $apiKey, string $prompt): string
    {
        return match ($provider) {
            'openai' => $this->callOpenAI($model, $apiKey, $prompt),
            'anthropic' => $this->callAnthropic($model, $apiKey, $prompt),
            'google' => $this->callGoogle($model, $apiKey, $prompt),
            default => throw new \Exception('Unsupported provider'),
        };
    }

    private function callOpenAI(string $model, string $apiKey, string $prompt): string
    {
        $response = Http::timeout(25)->withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ])->post('https://api.openai.com/v1/chat/completions', [
            'model' => $model,
            'messages' => [['role' => 'user', 'content' => $prompt]],
            'max_tokens' => 2000,
            'temperature' => 0.3,
        ]);

        if ($response->successful()) {
            return $response->json()['choices'][0]['message']['content'] ?? '';
        }
        throw new \Exception('OpenAI error: ' . $response->body());
    }

    private function callAnthropic(string $model, string $apiKey, string $prompt): string
    {
        $response = Http::timeout(25)->withHeaders([
            'x-api-key' => $apiKey,
            'Content-Type' => 'application/json',
            'anthropic-version' => '2023-06-01',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model' => $model,
            'max_tokens' => 2000,
            'messages' => [['role' => 'user', 'content' => $prompt]],
        ]);

        if ($response->successful()) {
            return $response->json()['content'][0]['text'] ?? '';
        }
        throw new \Exception('Anthropic error: ' . $response->body());
    }

    private function callGoogle(string $model, string $apiKey, string $prompt): string
    {
        $response = Http::timeout(25)->withHeaders([
            'Content-Type' => 'application/json',
        ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
            'contents' => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => ['temperature' => 0.7, 'maxOutputTokens' => 10000],
        ]);

        if ($response->successful()) {
            $data = $response->json();
            if (isset($data['error'])) throw new \Exception('Google error: ' . $data['error']['message']);
            return $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
        }
        throw new \Exception('Google error: ' . $response->body());
    }

    // Execute query safely
    private function executeQuery(array $plan, User $user, array $context): array
    {
        Log::info("AI Plan: " . json_encode($plan));
        if ($plan['intent'] !== 'data_query') {
            return ['intent' => $plan['intent'], 'message' => $plan['message'] ?? '', 'data' => []];
        }

        $table = $plan['table'] ?? '';
        if (!$table || !isset($context['schema'][$table])) {
            return ['intent' => 'invalid', 'data' => []];
        }

        $tableInfo = $context['schema'][$table];
        $isChild = $tableInfo['is_child'] ?? false;
        
        $query = DB::table($table);

        if ($isChild) {
            $parent = $tableInfo['parent'];
            $fk = $tableInfo['fk'];
            $query->join($parent, "{$parent}.id", '=', "{$table}.{$fk}")
                  ->where("{$parent}.created_by", creatorId());
        } elseif (in_array('created_by', $tableInfo['columns'])) {
            $query->where("{$table}.created_by", creatorId());
        }

        // Apply filters
        foreach ($plan['filters'] ?? [] as $col => $val) {
            if (in_array($col, $this->blockedColumns)) continue;
            if (!in_array($col, $tableInfo['columns'])) continue;

            if ($val === 'this_year') {
                $query->whereYear($col, now()->year);
            } elseif ($val === 'this_month') {
                $query->whereMonth($col, now()->month)->whereYear($col, now()->year);
            } elseif ($val === 'today') {
                $query->whereDate($col, now()->toDateString());
            } else {
                $query->where($col, 'like', "%{$val}%");
            }
        }

        // Handle aggregate
        if (!empty($plan['aggregate']['function'])) {
            $fn = strtoupper($plan['aggregate']['function']);
            $col = $plan['aggregate']['column'] ?? '*';
            
            $result = match($fn) {
                'COUNT' => $query->count(),
                'SUM' => $query->sum($col),
                'AVG' => $query->avg($col),
                'MIN' => $query->min($col),
                'MAX' => $query->max($col),
                default => $query->count(),
            };

            return ['intent' => 'aggregate', 'data' => ['function' => $fn, 'result' => $result]];
        }

        // Apply select columns if specified
        if (!empty($plan['select'])) {
            $selectCols = array_filter($plan['select'], fn($col) => 
                in_array($col, $tableInfo['columns']) && !in_array($col, $this->blockedColumns)
            );
            if (!empty($selectCols)) {
                $query->select(array_map(fn($col) => "{$table}.{$col}", $selectCols));
            }
        } else {
            $query->select("{$table}.*");
        }

        if ($isChild && $tableInfo['parent'] === 'users') {
            $query->addSelect("users.name as employee_name");
        } elseif (in_array('user_id', $tableInfo['columns'] ?? []) && $table !== 'users') {
            $query->leftJoin('users as u_join', "{$table}.user_id", '=', 'u_join.id')
                  ->addSelect('u_join.name as employee_name');
        } elseif (in_array('employee_id', $tableInfo['columns'] ?? []) && $table !== 'employees') {
            $query->leftJoin('employees as emp_join', "{$table}.employee_id", '=', 'emp_join.id')
                  ->leftJoin('users as u_join', 'emp_join.user_id', '=', 'u_join.id')
                  ->addSelect('u_join.name as employee_name');
        }

        // Regular query
        $limit = min((int)($plan['limit'] ?? 20), 50);
        return ['intent' => 'data_query', 'data' => $query->limit($limit)->get()->toArray()];
    }

    // Format response using AI
    private function formatResponse(string $question, array $result, array $history): string
    {
        if ($result['intent'] === 'out_of_scope') {
            return __('I can only answer questions about your HR data. Please ask about employees, attendance, leaves, tickets, etc.');
        }
        if ($result['intent'] === 'no_permission') {
            return __('You do not have permission to access that data.');
        }
        if ($result['intent'] === 'invalid') {
            return __('I could not find the data you are looking for.');
        }
        if ($result['intent'] === 'api_error') {
            return $result['message'] ?? __('AI service error.');
        }

        $config = $this->getAIConfig();
        if (!$config) {
            return $this->fallbackFormat($result);
        }

        try {
            $formattingPrompt = $this->buildFormattingPrompt($question, $result, $history);
            $response = $this->callAI($config['provider'], $config['model'], $config['api_key'], $formattingPrompt);
            return trim($response) ?: $this->fallbackFormat($result);
        } catch (\Exception $e) {
            return $this->fallbackFormat($result);
        }
    }

    // Build formatting prompt for AI
    private function buildFormattingPrompt(string $question, array $result, array $history): string
    {
        $historyJson = json_encode(array_slice($history, -4));
        $dataJson = json_encode($result['data']);
        $intent = $result['intent'];

        if ($intent === 'aggregate') {
            $fn = $result['data']['function'];
            $value = $result['data']['result'];
            
            return <<<PROMPT
You are a professional ERP assistant. Your task is to present aggregate data in a clear, natural way.

QUESTION: "{$question}"
AGGREGATE: {$fn}
VALUE: {$value}
CONVERSATION HISTORY: {$historyJson}

FORMATTING INSTRUCTIONS:
1. Write ONE clear sentence that directly answers the question
2. Format numbers properly:
   - COUNT: Use whole numbers with commas (e.g., "1,234 invoices")
   - SUM: Use 2 decimals with currency symbol (e.g., "\$12,450.50" or "₹1,23,450.50")
   - AVG: Use 2 decimals with currency symbol (e.g., "\$1,245.50 per invoice")
3. Include time context from the question ("this month", "this year", "today", etc.)
4. Use business terminology (revenue, sales, expenses, etc.)
5. Be direct and professional - no extra commentary

EXAMPLES:
- Question: "What's my total revenue this month?" → "Your total revenue this month is \$45,230.75."
- Question: "How many pending invoices?" → "You have 12 pending invoices."
- Question: "Average deal value this year?" → "The average deal value this year is \$8,450.25."

OUTPUT: Return ONLY the formatted sentence. No markdown, no explanations, no extra text.
PROMPT;
        }

        // List result
        $data = $result['data'];
        if (empty($data)) {
            return __('No records found.');
        }

        $count = count($data);
        $displayData = array_slice($data, 0, 10);
        $displayJson = json_encode($displayData);

        return <<<PROMPT
You are a professional ERP assistant. Your task is to present query results in a clear, scannable format.

QUESTION: "{$question}"
TOTAL RECORDS: {$count}
DATA SAMPLE: {$displayJson}
CONVERSATION HISTORY: {$historyJson}

FORMATTING INSTRUCTIONS:
1. Start with a summary: "I found {$count} [record type]" or "Here are {$count} [record type]"
2. List each record on a new line with a bullet point (•)
3. For each record, show:
   - Primary identifier FIRST (invoice_number, proposal_number, name, employee_id, etc.)
   - 2-3 most relevant fields (status, amount, date)
   - Use pipe separator (|) between fields
4. Format data properly:
   - Amounts: 2 decimals with currency (\$1,234.50)
   - Dates: Short format (Jan 15, 2024 or 2024-01-15)
   - Status: Capitalize first letter (Draft, Paid, Pending)
5. If showing partial results, add "(showing first 10 of {$count})" after summary
6. Keep it clean - no extra explanations or suggestions

EXAMPLES:

For invoices:
"I found 5 draft invoices:
• INV-001 | Draft | \$1,250.00 | Jan 15, 2024
• INV-002 | Draft | \$3,400.50 | Jan 18, 2024
• INV-003 | Draft | \$890.00 | Jan 20, 2024"

For leads:
"Here are 3 active leads:
• John Smith | john@example.com | +1234567890 | Active
• Sarah Johnson | sarah@example.com | +9876543210 | Active
• Mike Davis | mike@example.com | +5555555555 | Active"

For projects:
"I found 4 ongoing projects:
• Website Redesign | Ongoing | \$15,000.00 | Jan 1 - Mar 31
• Mobile App | Ongoing | \$25,000.00 | Feb 1 - Jun 30
• CRM Integration | Ongoing | \$8,500.00 | Jan 15 - Apr 15"

OUTPUT: Return ONLY the formatted list. No markdown code blocks, no extra commentary.
PROMPT;
    }

    // Fallback formatting without AI
    private function fallbackFormat(array $result): string
    {
        if ($result['intent'] === 'aggregate') {
            $fn = $result['data']['function'];
            $value = $result['data']['result'];
            $formatted = ($fn === 'COUNT') ? number_format($value, 0) : number_format($value, 2);
            return "{$fn}: {$formatted}";
        }

        $data = $result['data'];
        if (empty($data)) return __('No records found.');

        $count = count($data);
        $lines = [__('Found') . ' ' . $count . ' ' . __('record(s)') . ($count > 10 ? ' (showing first 10)' : '') . ':'];
        foreach (array_slice($data, 0, 10) as $row) {
            $row = (array) $row;
            $label = $row['proposal_number'] ?? $row['employee_name'] ?? $row['name'] ?? $row['invoice_number'] ?? $row['title'] ?? $row['id'] ?? '';
            $extra = $row['status'] ?? $row['employment_type'] ?? $row['amount'] ?? '';
            $lines[] = '- ' . implode(' | ', array_filter([$label, $extra]));
        }

        return implode("\n", $lines);
    }

    private function formatError(string $error): string
    {
        if (str_contains($error, '503') || str_contains($error, 'UNAVAILABLE')) {
            return __('AI service is busy. Try again.');
        }
        if (str_contains($error, '401') || str_contains($error, 'API key')) {
            return __('Invalid API key.');
        }
        if (str_contains($error, '429')) {
            return __('Rate limit exceeded.');
        }
        return __('AI service error.');
    }
}
