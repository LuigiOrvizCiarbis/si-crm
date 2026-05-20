<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class SetSpatieTeamId
{
    public function __construct(private PermissionRegistrar $registrar) {}

    /**
     * Bind Spatie's team scope to the authenticated user's tenant so role lookups
     * are automatically tenant-isolated.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && $user->tenant_id !== null) {
            $this->registrar->setPermissionsTeamId($user->tenant_id);
        }

        return $next($request);
    }
}
