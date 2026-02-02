<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Contact;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $search = trim($request->query('search',''));

        $q = Contact::query()
            ->where('tenant_id', $tenantId)
            ->with(['conversations' => fn($c) => $c->latest('last_message_at')->limit(1)]);

        if ($search !== '') {
            $q->where(function($w) use ($search) {
                $w->where('name','like',"%$search%")
                  ->orWhere('phone','like',"%$search%");
            });
        }

        $contacts = $q->orderByDesc('updated_at')->paginate(
            (int) $request->query('per_page', 20)
        );

        return response()->json([
            'data' => $contacts->items(),
            'meta' => [
                'total' => $contacts->total(),
                'current_page' => $contacts->currentPage(),
                'last_page' => $contacts->lastPage(),
            ]
        ]);
    }

    public function show(Request $request, Contact $contact)
    {
        $this->authorizeTenant($request, $contact->tenant_id);

        $contact->load(['conversations' => fn($c) => $c->latest('last_message_at')->limit(5)]);
        return response()->json(['data' => $contact]);
    }

    private function authorizeTenant(Request $request, int $tenantId): void
    {
        if ($tenantId !== $request->user()->tenant_id) {
            abort(403);
        }
    }
}
