filepath = 'app/Http/Controllers/Settings/SystemSettingsController.php'
with open(filepath, 'r') as f:
    content = f.read()

import re

target = r"""    public function updateAIAgentSettings\(Request \$request\)
    \{
        if\(Auth::user\(\)->can\('manage-ai-agent'\)\)
        \{
            \$request->validate\(\[
                'settings\.ai_agent_provider' => 'required\|string\|in:openai,anthropic,google',
                'settings\.ai_agent_model' => 'required\|string\|max:255',
                'settings\.ai_agent_api_key' => 'required\|string\|max:255',
            \]\);

            \$settings = \$request->input\('settings'\);

            foreach \(\$settings as \$key => \$value\) \{
                updateSetting\(\$key, \$value\);
            \}

            return redirect\(\)->back\(\)->with\('success', __\('AI Agent settings saved successfully\.'\)\);
        \}
        else
        \{
            return back\(\)->with\('error', __\('Permission denied'\)\);
        \}
    \}"""

replacement = """    public function updateAIAgentSettings(Request $request)
    {
        $request->validate([
            'settings.ai_agent_provider' => 'required|string|in:openai,anthropic,google',
            'settings.ai_agent_model' => 'required|string|max:255',
            'settings.ai_agent_api_key' => 'required|string|max:255',
        ]);

        $settings = $request->input('settings');

        foreach ($settings as $key => $value) {
            updateSetting($key, $value);
        }

        return redirect()->back()->with('success', __('AI Agent settings saved successfully.'));
    }"""

content = re.sub(target, replacement, content)

with open(filepath, 'w') as f:
    f.write(content)

print("Fixed updateAIAgentSettings")
