<?php

namespace App\Services;

use App\Models\Contact;
use Illuminate\Http\UploadedFile;

class ContactImportService
{
    /**
     * Import contacts from a CSV file.
     *
     * @param  array<string, int>  $mapping  Column mapping (field name => column index)
     * @return array{imported: int, duplicates: int, errors: int, error_rows: list<array{row: int, reason: string}>, total: int}
     */
    public function import(UploadedFile $file, array $mapping, int $tenantId): array
    {
        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            return ['imported' => 0, 'duplicates' => 0, 'errors' => 0, 'error_rows' => [], 'total' => 0];
        }

        // Detect delimiter from the first line (comma or semicolon)
        $delimiter = $this->detectDelimiter($handle);

        // Skip header row
        fgetcsv($handle, 0, $delimiter);

        // Pre-load existing phones and emails for duplicate detection (single query)
        $existingPhones = [];
        $existingEmails = [];

        Contact::where('tenant_id', $tenantId)
            ->select('phone', 'email')
            ->each(function (Contact $c) use (&$existingPhones, &$existingEmails) {
                if ($c->phone !== null && $c->phone !== '') {
                    $existingPhones[$this->normalizePhone($c->phone)] = true;
                }
                if ($c->email !== null && $c->email !== '') {
                    $existingEmails[strtolower(trim($c->email))] = true;
                }
            });

        $imported = 0;
        $duplicates = 0;
        $errors = 0;
        $errorRows = [];
        $batch = [];
        $rowNumber = 1; // 1-based, after header

        $now = now();
        $nameCol = $mapping['name'];
        $phoneCol = $mapping['phone'] ?? null;
        $emailCol = $mapping['email'] ?? null;

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $rowNumber++;

            $name = trim($row[$nameCol] ?? '');
            $phone = $phoneCol !== null ? trim($row[$phoneCol] ?? '') : '';
            $email = $emailCol !== null ? trim($row[$emailCol] ?? '') : '';

            // Validate name
            if ($name === '') {
                $errors++;
                $errorRows[] = ['row' => $rowNumber, 'reason' => 'Nombre vacío'];

                continue;
            }

            if (mb_strlen($name) > 255) {
                $errors++;
                $errorRows[] = ['row' => $rowNumber, 'reason' => 'Nombre excede 255 caracteres'];

                continue;
            }

            // Validate email format
            if ($email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors++;
                $errorRows[] = ['row' => $rowNumber, 'reason' => 'Email inválido'];

                continue;
            }

            // Validate phone length
            if (mb_strlen($phone) > 50) {
                $errors++;
                $errorRows[] = ['row' => $rowNumber, 'reason' => 'Teléfono excede 50 caracteres'];

                continue;
            }

            // Check duplicates
            $normalizedPhone = $this->normalizePhone($phone);
            $normalizedEmail = strtolower($email);

            if (($normalizedPhone !== '' && isset($existingPhones[$normalizedPhone]))
                || ($normalizedEmail !== '' && isset($existingEmails[$normalizedEmail]))) {
                $duplicates++;

                continue;
            }

            // Track for in-batch duplicate detection
            if ($normalizedPhone !== '') {
                $existingPhones[$normalizedPhone] = true;
            }
            if ($normalizedEmail !== '') {
                $existingEmails[$normalizedEmail] = true;
            }

            $batch[] = [
                'tenant_id' => $tenantId,
                'name' => $name,
                'phone' => $phone ?: null,
                'email' => $email ?: null,
                'source' => 'manual',
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if (count($batch) >= 100) {
                Contact::insert($batch);
                $imported += count($batch);
                $batch = [];
            }
        }

        // Insert remaining
        if (count($batch) > 0) {
            Contact::insert($batch);
            $imported += count($batch);
        }

        fclose($handle);

        return [
            'imported' => $imported,
            'duplicates' => $duplicates,
            'errors' => $errors,
            'error_rows' => array_slice($errorRows, 0, 50),
            'total' => $imported + $duplicates + $errors,
        ];
    }

    /**
     * Detect whether the CSV uses comma or semicolon as delimiter
     * by reading the first line and rewinding the file pointer.
     *
     * @param  resource  $handle
     */
    private function detectDelimiter($handle): string
    {
        $firstLine = fgets($handle);
        rewind($handle);

        if ($firstLine === false) {
            return ',';
        }

        $semicolons = substr_count($firstLine, ';');
        $commas = substr_count($firstLine, ',');

        return $semicolons > $commas ? ';' : ',';
    }

    private function normalizePhone(string $phone): string
    {
        return preg_replace('/[^0-9+]/', '', $phone) ?: '';
    }
}
