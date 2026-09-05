<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Throwable;

class FreedcampService
{
    private const BASE_URL = 'https://freedcamp.com/api/v1';

    public function testConnection(?string $apiKey = null, ?string $secretKey = null): Response
    {
        return $this->get('sessions/current', [], $apiKey, $secretKey);
    }

    public function workspace(): array
    {
        return $this->successfulData($this->get('sessions/current'));
    }

    public function times(string $dateFrom, string $dateTo): array
    {
        $query = ['date' => ['from' => $dateFrom, 'to' => $dateTo], 'limit' => 200];
        $firstData = $this->successfulData($this->get('times', $query + ['offset' => 0]));
        $times = $firstData['times'] ?? [];
        $total = (int) ($firstData['meta']['total_count'] ?? count($times));
        $offsets = $total > 200 ? range(200, $total - 1, 200) : [];

        // Freedcamp caps pages at 200. Fetch subsequent pages concurrently in
        // small groups so a full-history sync does not block for several minutes.
        foreach (array_chunk($offsets, 10) as $offsetGroup) {
            foreach ($this->getTimesPages($query, $offsetGroup) as $response) {
                $data = $this->successfulData($response);
                $times = array_merge($times, $data['times'] ?? []);
            }
        }

        return $times;
    }

    /** @return array<string, Response> */
    private function getTimesPages(array $query, array $offsets): array
    {
        $apiKey = $this->decryptSetting('freedcamp_api_key');
        $secretKey = $this->decryptSetting('freedcamp_secret_key');

        if (blank($apiKey) || blank($secretKey)) {
            throw new \RuntimeException(__('Freedcamp API credentials are not configured.'));
        }

        $timestamp = time();
        $authQuery = [
            'timestamp' => $timestamp,
            'hash' => hash_hmac('sha1', $apiKey.$timestamp, $secretKey),
        ];

        return Http::pool(fn (Pool $pool) => collect($offsets)->mapWithKeys(fn (int $offset) => [
            (string) $offset => $pool->as((string) $offset)
                ->acceptJson()
                ->withHeaders(['X-API-KEY' => $apiKey])
                ->timeout(15)
                ->get(self::BASE_URL.'/times', array_merge($query, ['offset' => $offset], $authQuery)),
        ])->all());
    }

    public function encryptCredential(string $value): string
    {
        return Crypt::encryptString($value);
    }

    private function get(
        string $path,
        array $query = [],
        ?string $apiKey = null,
        ?string $secretKey = null,
    ): Response {
        $apiKey ??= $this->decryptSetting('freedcamp_api_key');
        $secretKey ??= $this->decryptSetting('freedcamp_secret_key');

        if (blank($apiKey) || blank($secretKey)) {
            throw new \RuntimeException(__('Freedcamp API credentials are not configured.'));
        }

        $timestamp = time();

        return Http::acceptJson()
            ->withHeaders(['X-API-KEY' => $apiKey])
            ->timeout(15)
            ->get(self::BASE_URL.'/'.ltrim($path, '/'), array_merge($query, [
                'timestamp' => $timestamp,
                'hash' => hash_hmac('sha1', $apiKey.$timestamp, $secretKey),
            ]));
    }

    private function successfulData(Response $response): array
    {
        if (! $response->successful() || $response->json('msg') !== 'OK') {
            throw new \RuntimeException($response->json('msg', __('Freedcamp API request failed.')));
        }

        return $response->json('data', []);
    }

    private function decryptSetting(string $key): ?string
    {
        $value = getSetting($key);

        if (blank($value)) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (Throwable) {
            return $value;
        }
    }
}
