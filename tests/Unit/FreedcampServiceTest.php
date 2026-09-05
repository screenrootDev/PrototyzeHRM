<?php

use App\Services\FreedcampService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

uses(Tests\TestCase::class);

it('signs secured Freedcamp API requests', function () {
    Http::fake([
        'freedcamp.com/api/v1/*' => Http::response([
            'http_code' => 200,
            'msg' => 'OK',
        ]),
    ]);

    $response = app(FreedcampService::class)->testConnection('test-api-key', 'test-secret-key');

    expect($response->successful())->toBeTrue();

    Http::assertSent(function (Request $request) {
        parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

        return $request->url() !== null
            && str_starts_with($request->url(), 'https://freedcamp.com/api/v1/sessions/current')
            && $request->hasHeader('X-API-KEY', 'test-api-key')
            && isset($query['timestamp'], $query['hash'])
            && hash_equals(
                hash_hmac('sha1', 'test-api-key'.$query['timestamp'], 'test-secret-key'),
                $query['hash'],
            );
    });
});
