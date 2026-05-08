<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportContactsRequest;
use App\Models\Contact;
use App\Services\ContactImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $search = trim($request->query('search', ''));

        $q = Contact::query()
            ->where('tenant_id', $tenantId)
            ->with(['conversations' => fn ($c) => $c->latest('last_message_at')->limit(1)]);

        if ($search !== '') {
            $q->where(function ($w) use ($search) {
                $w->where('name', 'like', "%$search%")
                    ->orWhere('phone', 'like', "%$search%");
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
            ],
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $monthAgo = now()->subDays(30);

        $total = Contact::where('tenant_id', $tenantId)->count();
        $newThisMonth = Contact::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $monthAgo)
            ->count();

        $activeLeads = Contact::where('tenant_id', $tenantId)
            ->whereHas('conversations', fn ($q) => $q->where('status', 'open'))
            ->count();

        $qualified = Contact::where('tenant_id', $tenantId)
            ->whereHas('opportunities', fn ($q) => $q->whereIn('status', ['won', 'open'])->whereNotNull('pipeline_stage_id'))
            ->count();

        $won = Contact::where('tenant_id', $tenantId)
            ->whereHas('opportunities', fn ($q) => $q->where('status', 'won'))
            ->count();

        $conversionRate = $total > 0 ? round(($won / $total) * 100, 1) : 0.0;

        return response()->json([
            'total_contacts' => $total,
            'new_this_month' => $newThisMonth,
            'active_leads' => $activeLeads,
            'qualified' => $qualified,
            'won' => $won,
            'conversion_rate' => $conversionRate,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->contactRules());

        $contact = Contact::create([
            'tenant_id' => $request->user()->tenant_id,
            ...$validated,
            'source' => $validated['source'] ?? 'manual',
        ]);

        return response()->json(['data' => $contact], 201);
    }

    public function show(Request $request, Contact $contact)
    {
        $this->authorizeTenant($request, $contact->tenant_id);

        $contact->load(['conversations' => fn ($c) => $c->latest('last_message_at')->limit(5)]);

        return response()->json(['data' => $contact]);
    }

    public function update(Request $request, Contact $contact)
    {
        $this->authorizeTenant($request, $contact->tenant_id);

        $validated = $request->validate($this->contactRules(partial: true));
        $contact->update($validated);

        return response()->json(['data' => $contact]);
    }

    public function destroy(Request $request, Contact $contact)
    {
        $this->authorizeTenant($request, $contact->tenant_id);

        $contact->delete();

        return response()->json(['message' => 'Contacto eliminado']);
    }

    public function import(ImportContactsRequest $request): JsonResponse
    {
        $mapping = $request->decodedMapping();
        $tenantId = $request->user()->tenant_id;

        $service = new ContactImportService;
        $result = $service->import($request->file('file'), $mapping, $tenantId);

        return response()->json(['data' => $result]);
    }

    private function contactRules(bool $partial = false): array
    {
        $nameRule = $partial ? 'sometimes|required|string|max:255' : 'required|string|max:255';

        return [
            'name' => $nameRule,
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'source' => 'nullable|string|in:whatsapp,instagram,facebook,manual',
        ];
    }

    private function authorizeTenant(Request $request, int $tenantId): void
    {
        if ($tenantId !== $request->user()->tenant_id) {
            abort(403);
        }
    }
}
