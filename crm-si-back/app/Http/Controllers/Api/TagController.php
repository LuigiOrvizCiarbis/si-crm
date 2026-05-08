<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Tag;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\JsonResponse;

class TagController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Tag::query()->orderBy('name');

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('type')) {
            $query->where('type', (string) $request->query('type'));
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules($request));
        $slug = $this->slugFor($validated['name']);
        $this->ensureSlugIsAvailable($request, $slug);

        $tag = Tag::create([
            ...$validated,
            'tenant_id' => $request->user()->tenant_id,
            'created_by' => $request->user()->id,
            'slug' => $slug,
            'color' => $validated['color'] ?? '#64748b',
            'is_system' => false,
        ]);

        return response()->json(['data' => $tag], 201);
    }

    public function show(Request $request, Tag $tag): JsonResponse
    {
        $this->authorizeTenant($request, $tag->tenant_id);

        return response()->json(['data' => $tag]);
    }

    public function update(Request $request, Tag $tag): JsonResponse
    {
        $this->authorizeTenant($request, $tag->tenant_id);

        $validated = $request->validate($this->rules($request, $tag));

        if (array_key_exists('name', $validated)) {
            $validated['slug'] = $this->slugFor($validated['name']);
            $this->ensureSlugIsAvailable($request, $validated['slug'], $tag);
        }

        $tag->update($validated);

        return response()->json(['data' => $tag->refresh()]);
    }

    public function destroy(Request $request, Tag $tag): JsonResponse
    {
        $this->authorizeTenant($request, $tag->tenant_id);

        $tag->delete();

        return response()->json(['message' => 'Etiqueta eliminada']);
    }

    public function attachToContact(Request $request, Contact $contact): JsonResponse
    {
        $this->authorizeTenant($request, $contact->tenant_id);

        return $this->attachTags($request, $contact);
    }

    public function detachFromContact(Request $request, Contact $contact, Tag $tag): JsonResponse
    {
        $this->authorizeTenant($request, $contact->tenant_id);
        $this->authorizeTenant($request, $tag->tenant_id);

        $contact->tags()->detach($tag->id);
        $contact->load('tags');

        return response()->json(['data' => $contact]);
    }

    public function attachToConversation(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeTenant($request, $conversation->tenant_id);

        return $this->attachTags($request, $conversation);
    }

    public function detachFromConversation(Request $request, Conversation $conversation, Tag $tag): JsonResponse
    {
        $this->authorizeTenant($request, $conversation->tenant_id);
        $this->authorizeTenant($request, $tag->tenant_id);

        $conversation->tags()->detach($tag->id);
        $conversation->load('tags');

        return response()->json(['data' => $conversation]);
    }

    private function attachTags(Request $request, Model $taggable): JsonResponse
    {
        $validated = $request->validate([
            'tag_ids' => ['required', 'array', 'min:1'],
            'tag_ids.*' => [
                'integer',
                Rule::exists('tags', 'id')->where(fn ($query) => $query->where('tenant_id', $request->user()->tenant_id)),
            ],
        ]);

        $pivotData = collect($validated['tag_ids'])
            ->mapWithKeys(fn (int $tagId) => [
                $tagId => [
                    'tenant_id' => $request->user()->tenant_id,
                    'assigned_by' => $request->user()->id,
                ],
            ])
            ->all();

        $taggable->tags()->syncWithoutDetaching($pivotData);
        $taggable->load('tags');

        return response()->json(['data' => $taggable]);
    }

    private function rules(Request $request, ?Tag $tag = null): array
    {
        $nameRules = [$tag ? 'sometimes' : 'required', 'string', 'max:80'];

        return [
            'name' => $nameRules,
            'color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'type' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    private function slugFor(string $name): string
    {
        return Str::slug($name) ?: Str::lower(Str::random(8));
    }

    private function ensureSlugIsAvailable(Request $request, string $slug, ?Tag $tag = null): void
    {
        $exists = Tag::query()
            ->where('tenant_id', $request->user()->tenant_id)
            ->where('slug', $slug)
            ->when($tag, fn ($query) => $query->where('id', '!=', $tag->id))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'name' => 'Ya existe una etiqueta con ese nombre.',
            ]);
        }
    }

    private function authorizeTenant(Request $request, int $tenantId): void
    {
        if ($tenantId !== $request->user()->tenant_id) {
            abort(403);
        }
    }
}
