"use client"

import { useCallback, useEffect, useState } from "react"
import { MoreVertical, Pencil, Plus, Search, Trash2, Upload } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/components/Toast"
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  type Product,
  type ProductInput,
} from "@/lib/api/products"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ImportProductsDialog } from "@/components/products/import-products-dialog"

interface FormState {
  name: string
  price: string
  description: string
  is_active: boolean
}

const EMPTY_FORM: FormState = {
  name: "",
  price: "",
  description: "",
  is_active: true,
}

const PAGE_SIZE = 10

export function ProductsList() {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const load = useCallback(
    async (searchTerm?: string) => {
      setLoading(true)
      try {
        const data = await getProducts(searchTerm ? { search: searchTerm } : {})
        setProducts(data)
      } catch (error) {
        addToast({
          type: "error",
          title: t("catalog.loadError"),
          description: (error as Error).message,
        })
      } finally {
        setLoading(false)
      }
    },
    [addToast, t],
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1)
      void load(search.trim() || undefined)
    }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setForm({
      name: product.name,
      price: product.price ?? "",
      description: product.description ?? "",
      is_active: product.is_active,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      addToast({ type: "error", title: t("catalog.nameRequired") })
      return
    }

    const payload: ProductInput = {
      name: form.name.trim(),
      price: form.price.trim() === "" ? null : Number(form.price),
      description: form.description.trim() || null,
      is_active: form.is_active,
    }

    setSaving(true)
    try {
      if (editing) {
        await updateProduct(editing.id, payload)
        addToast({ type: "success", title: t("catalog.updated") })
      } else {
        await createProduct(payload)
        addToast({ type: "success", title: t("catalog.created") })
      }
      setDialogOpen(false)
      await load(search.trim() || undefined)
    } catch (error) {
      addToast({
        type: "error",
        title: t("catalog.saveError"),
        description: (error as Error).message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProduct(deleteTarget.id)
      addToast({ type: "success", title: t("catalog.deleted") })
      await load(search.trim() || undefined)
    } catch (error) {
      addToast({
        type: "error",
        title: t("catalog.deleteError"),
        description: (error as Error).message,
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const paginatedProducts = products.slice(pageStart, pageStart + PAGE_SIZE)

  const formatPrice = (price: string | null) => {
    if (price === null || price === "") return "—"
    const value = Number(price)
    if (Number.isNaN(value)) return price
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("catalog.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("catalog.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t("catalog.import")}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("catalog.newProduct")}
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("catalog.searchPlaceholder")}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("catalog.columnName")}</TableHead>
              <TableHead className="w-40">{t("catalog.columnPrice")}</TableHead>
              <TableHead className="w-32">{t("catalog.columnStatus")}</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  {t("catalog.loading")}
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  {t("catalog.empty")}
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    {product.description && (
                      <div className="line-clamp-1 text-sm text-muted-foreground">{product.description}</div>
                    )}
                  </TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? t("catalog.active") : t("catalog.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("catalog.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("catalog.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && products.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("catalog.paginationInfo", {
              from: pageStart + 1,
              to: pageStart + paginatedProducts.length,
              total: products.length,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              {t("catalog.previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              {t("catalog.next")}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("catalog.editProduct") : t("catalog.newProduct")}</DialogTitle>
            <DialogDescription>{t("catalog.dialogSubtitle")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="product-name">{t("catalog.columnName")}</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("catalog.namePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-price">{t("catalog.columnPrice")}</Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">{t("catalog.columnDescription")}</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t("catalog.descriptionPlaceholder")}
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="product-active">{t("catalog.activeLabel")}</Label>
                <p className="text-sm text-muted-foreground">{t("catalog.activeHint")}</p>
              </div>
              <Switch
                id="product-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              {t("catalog.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("catalog.saving") : t("catalog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("catalog.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("catalog.deleteConfirmBody", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("catalog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("catalog.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportProductsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={() => void load(search.trim() || undefined)}
      />
    </div>
  )
}
