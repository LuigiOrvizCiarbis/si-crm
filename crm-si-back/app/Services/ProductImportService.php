<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class ProductImportService
{
    /**
     * Import products from a CSV file.
     *
     * @param  array<string, mixed>  $mapping  Column mapping. Keys: name (required), price, description, is_active.
     * @return array{imported: int, duplicates: int, errors: int, error_rows: list<array{row: int, reason: string}>, total: int}
     */
    public function import(UploadedFile $file, array $mapping, int $tenantId, int $userId): array
    {
        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            return ['imported' => 0, 'duplicates' => 0, 'errors' => 0, 'error_rows' => [], 'total' => 0];
        }

        try {
            return DB::transaction(function () use ($handle, $mapping, $tenantId, $userId): array {
                return $this->processRows($handle, $mapping, $tenantId, $userId);
            });
        } finally {
            fclose($handle);
        }
    }

    /**
     * Parsea las filas del CSV e inserta en lotes. Corre dentro de una transacción:
     * si algún insert falla, se revierte todo el import.
     *
     * @param  resource  $handle
     * @param  array<string, mixed>  $mapping
     * @return array{imported: int, duplicates: int, errors: int, error_rows: list<array{row: int, reason: string}>, total: int}
     */
    private function processRows($handle, array $mapping, int $tenantId, int $userId): array
    {
        $delimiter = $this->detectDelimiter($handle);

        fgetcsv($handle, 0, $delimiter);

        $existingNames = [];
        Product::where('tenant_id', $tenantId)
            ->select('name')
            ->each(function (Product $p) use (&$existingNames): void {
                if ($p->name !== null && $p->name !== '') {
                    $existingNames[$this->normalizeName($p->name)] = true;
                }
            });

        $imported = 0;
        $duplicates = 0;
        $errors = 0;
        $errorRows = [];
        $batch = [];
        $rowNumber = 1;

        $now = now();
        $nameCol = $mapping['name'];
        $priceCol = $mapping['price'] ?? null;
        $descCol = $mapping['description'] ?? null;
        $activeCol = $mapping['is_active'] ?? null;

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $rowNumber++;

            $name = trim($row[$nameCol] ?? '');
            $price = $priceCol !== null ? trim($row[$priceCol] ?? '') : '';
            $description = $descCol !== null ? trim($row[$descCol] ?? '') : '';
            $active = $activeCol !== null ? trim($row[$activeCol] ?? '') : '';

            if ($name === '') {
                $errors++;
                $errorRows[] = ['row' => $rowNumber, 'reason' => 'Nombre vacío'];

                continue;
            }

            if (mb_strlen($name) > 150) {
                $errors++;
                $errorRows[] = ['row' => $rowNumber, 'reason' => 'Nombre excede 150 caracteres'];

                continue;
            }

            $priceValue = null;
            if ($price !== '') {
                $normalizedPrice = str_replace(',', '.', $price);
                if (! is_numeric($normalizedPrice) || (float) $normalizedPrice < 0) {
                    $errors++;
                    $errorRows[] = ['row' => $rowNumber, 'reason' => 'Precio inválido'];

                    continue;
                }
                $priceValue = round((float) $normalizedPrice, 2);
                if ($priceValue > 99999999.99) {
                    $errors++;
                    $errorRows[] = ['row' => $rowNumber, 'reason' => 'Precio excede el máximo'];

                    continue;
                }
            }

            if (mb_strlen($description) > 5000) {
                $errors++;
                $errorRows[] = ['row' => $rowNumber, 'reason' => 'Descripción excede 5000 caracteres'];

                continue;
            }

            $normalizedName = $this->normalizeName($name);
            if (isset($existingNames[$normalizedName])) {
                $duplicates++;

                continue;
            }

            $existingNames[$normalizedName] = true;

            $batch[] = [
                'tenant_id' => $tenantId,
                'created_by' => $userId,
                'name' => $name,
                'price' => $priceValue,
                'description' => $description ?: null,
                'is_active' => $activeCol !== null ? $this->parseBool($active) : true,
                'source' => 'import',
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if (count($batch) >= 100) {
                Product::insert($batch);
                $imported += count($batch);
                $batch = [];
            }
        }

        if (count($batch) > 0) {
            Product::insert($batch);
            $imported += count($batch);
        }

        return [
            'imported' => $imported,
            'duplicates' => $duplicates,
            'errors' => $errors,
            'error_rows' => array_slice($errorRows, 0, 50),
            'total' => $imported + $duplicates + $errors,
        ];
    }

    private function parseBool(string $raw): bool
    {
        if ($raw === '') {
            return true;
        }

        return in_array(strtolower($raw), ['1', 'true', 'yes', 'si', 'sí', 'activo', 'active'], true);
    }

    private function normalizeName(string $name): string
    {
        return mb_strtolower(trim($name));
    }

    /**
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
}
