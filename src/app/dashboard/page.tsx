"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { EditOrderModal } from "@/components/EditOrderModal";
import { EditTrackingModal } from "@/components/EditTrackingModal";
import { SendToSupplierModal } from "@/components/SendToSupplierModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { OrderTrackingStepper } from "@/components/OrderTrackingStepper";
import { parseDeliveryPinFromOrder } from "@/lib/delivery-location";
import {
  Shield,
  ShieldCheck,
  Crown,
  Hammer,
  Truck,
  PackageCheck,
  CheckCircle2,
  Mail,
  Settings,
  Users,
  UserPlus,
  Search,
  X,
  Loader2,
  CreditCard,
  MapPin,
  Phone,
  Frame,
  Download,
  ExternalLink,
  Lock,
  Sparkles,
  Check,
  AlertCircle,
  Eye,
  Clock,
  Flame,
  BellRing,
  ArrowRight,
  FileText,
  UserCheck,
  Copy,
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Palette,
  Ruler,
  ImagePlus,
  Layers,
  Save,
  Upload,
  RefreshCw,
  SlidersHorizontal,
  PenTool,
  Gift,
  Maximize2,
  GripVertical,
} from "lucide-react";
import type {
  OrderRecord,
  EmailQueueRecord,
  ProductRecord,
  ProductCustomizationConfig,
  ProductFinishOption,
  PlatformSettingsMap,
  ProfileRecord,
} from "@/lib/db-service";
import type { FamousCharacter } from "@/data/characters";
import {
  exportPrintReadyImage,
  resolvePrintBleedSpec,
  CANVAS_WRAP_BLEED_CM,
  type PrintPreset,
  type FrameOption,
} from "@/lib/print-export";
import type { UserRole } from "@/lib/auth";
import { setCachedSessionUser } from "@/lib/client-session";

const SUPER_ADMIN_EMAIL = "nmoriano26@gmail.com";

function isAdminRole(role?: string | null): boolean {
  return role === "admin" || role === "super_admin";
}

type SanitizedUser = Omit<ProfileRecord, "password_hash">;

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string | null;
}

/**
 * Prioridad operativa para que el administrador vea siempre primero
 * las órdenes recientes/pendientes que requieren atención inmediata.
 */
function getOrderOperationalPriority(order: OrderRecord): number {
  if (order.status === "cancelled") return 99;
  if (order.status === "delivered" || order.status === "completed") return 50;
  // Si aún falta verificar el pago, máxima alerta (Prioridad 1)
  if (order.payment_status === "partial_pending") return 1;
  // Estado inicial: Pendiente de envío al proveedor
  if (order.status === "pending") return 2;
  // En Fabricación
  if (order.status === "manufacturing") return 3;
  // En Camino
  if (order.status === "in_transit") return 4;
  return 10;
}

function formatRelativeTime(isoDate: string): string {
  const created = new Date(isoDate).getTime();
  if (Number.isNaN(created)) return "";
  const diffMinutes = Math.max(0, Math.floor((Date.now() - created) / 60000));
  if (diffMinutes < 1) return "Hace instantes";
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return new Date(isoDate).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });
}

export default function AdminDashboardPage() {

  const [confirmModalData, setConfirmModalData] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "default" | "destructive" | "success";
    action: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    variant: "default",
    action: async () => {},
  });


  const [activeTab, setActiveTab] = useState<
    "orders" | "cuadros" | "users" | "settings" | "emails"
  >("orders");

  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [users, setUsers] = useState<SanitizedUser[]>([]);
  const [emailQueue, setEmailQueue] = useState<EmailQueueRecord[]>([]);
  const [isResendConfigured, setIsResendConfigured] = useState<boolean>(false);
  const [isRetryingEmails, setIsRetryingEmails] = useState(false);
  const [retryingEmailId, setRetryingEmailId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [settings, setSettings] = useState<PlatformSettingsMap | null>(null);

  // Dynamic Cuadros Personalizados Configurator State
  const [cuadrosSection, setCuadrosSection] = useState<
    "characters" | "frames" | "sizes" | "finishes"
  >("characters");
  const [isSavingCuadros, setIsSavingCuadros] = useState(false);
  const [adminEmailsInput, setAdminEmailsInput] = useState<string>(
    "apolenaperu@gmail.com",
  );
  const [supplierEmailInput, setSupplierEmailInput] = useState<string>(
    "mariano260996@gmail.com",
  );
  const [deletingOrder, setDeletingOrder] = useState<OrderRecord | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  // Character Modal State
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [previewCharacterImage, setPreviewCharacterImage] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(
    null,
  );
  const [isAnalyzingCharacter, setIsAnalyzingCharacter] = useState(false);
  const [analysisSuccessMsg, setAnalysisSuccessMsg] = useState<string | null>(
    null,
  );
  const [analysisErrorMsg, setAnalysisErrorMsg] = useState<string | null>(null);
  const [showAdvancedSample, setShowAdvancedSample] = useState(false);
  const [charForm, setCharForm] = useState<FamousCharacter>({
    id: "",
    name: "",
    characterTitle: "",
    universe: "",
    description: "",
    accentColor: "bg-terracotta-500",
    tagColor: "bg-white/90 text-stone-800 border-stone-200/80",
    maskUrl: "/masks/default-mask.png",
    characterImageUrl: "",
    fusionSampleUrl: "",
    prompt: "",
    negativePrompt:
      "human face, human hands, cartoon, illustration, low quality, blurry, deformed eyes",
    isAvailable: true,
  });

  // Frame Modal State
  const [showFrameModal, setShowFrameModal] = useState(false);
  const [editingFrameId, setEditingFrameId] = useState<string | null>(null);
  const [frameForm, setFrameForm] = useState<FrameOption>({
    id: "",
    name: "",
    description: "",
    priceModifierPen: 0,
    colorHex: "#1C1917",
    imageUrl: null,
    images: [],
    isAvailable: true,
  });

  // Print Size Modal State
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null);
  const [sizeForm, setSizeForm] = useState<PrintPreset>({
    id: "",
    tier: "",
    label: "",
    cmDimensions: "",
    inchDimensions: "",
    dpi: 300,
    baseWidthPx: 4724,
    baseHeightPx: 5906,
    recommendedUse: "",
    pricePen: 230,
    isAvailable: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Filters & Modal for Orders
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    | "priority_all"
    | "active_pending"
    | "pending"
    | "manufacturing"
    | "in_transit"
    | "delivered"
  >("priority_all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [supplierModalOrder, setSupplierModalOrder] =
    useState<OrderRecord | null>(null);
  const [aiHealthData, setAiHealthData] = useState<{
    health: {
      activeAlert: boolean;
      alertCount: number;
      lastAlertAt: string | null;
      lastProvider: string;
      lastReason: string;
      lastReporterEmail: string | null;
      resolvedAt: string | null;
    };
    envStatus: { openai: boolean; gemini: boolean; fal: boolean };
    providerStats: Record<
      string,
      { total: number; thisMonth: number; lastUsedAt: string | null }
    >;
    qualityAnalytics?: {
      winRate: {
        openai: {
          selectedCount: number;
          purchasedCount: number;
          avgQualityScore: number | null;
          evaluatedCount: number;
          autoRetriedCount: number;
        };
        gemini: {
          selectedCount: number;
          purchasedCount: number;
          avgQualityScore: number | null;
          evaluatedCount: number;
          autoRetriedCount: number;
        };
      };
      feedbackSummary: Record<string, number>;
      topCharacters: Array<{
        templateId: string;
        totalJobs: number;
        openaiWins: number;
        geminiWins: number;
        avgScore: number | null;
        feedbackCount: number;
      }>;
    };
  } | null>(null);
  const [isResolvingAiAlert, setIsResolvingAiAlert] = useState(false);
  const [voucherPreviewModal, setVoucherPreviewModal] = useState<{
    url: string;
    title: string;
    subtitle?: string;
    petInscriptionName?: string | null;
  } | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);
  const [copiedDedicationId, setCopiedDedicationId] = useState<string | null>(null);
  const [downloadingMasterOrderId, setDownloadingMasterOrderId] = useState<
    string | null
  >(null);

  const handleDownloadMasterWithBleed = async (order: OrderRecord) => {
    const item = order.packages?.[0]?.items?.[0];
    if (!item) return;

    setDownloadingMasterOrderId(order.id);

    let imageSrc = item.customizations?.master_art_url || null;
    const isWatermarked = (url?: string | null) =>
      Boolean(
        url &&
          (url.includes("/previews/") || url.includes("/uploads/previews/")),
      );

    // Si no tiene master_art_url o apunta a una vista previa con marca de agua, consultar al servidor
    if (!imageSrc || isWatermarked(imageSrc)) {
      try {
        const res = await fetch(`/api/admin/orders/${order.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.masterArtUrl && !isWatermarked(data.masterArtUrl)) {
            imageSrc = data.masterArtUrl;
            // Actualizar la orden en el estado local para futuras descargas inmediatas
            setOrders((prev) =>
              prev.map((o) => {
                if (o.id !== order.id) return o;
                const pkg = o.packages?.[0];
                const itm = pkg?.items?.[0];
                if (!itm) return o;
                return {
                  ...o,
                  packages: [
                    {
                      ...pkg,
                      items: [
                        {
                          ...itm,
                          customizations: {
                            ...(itm.customizations || {}),
                            master_art_url: data.masterArtUrl,
                          },
                        },
                      ],
                    },
                  ],
                };
              }),
            );
          }
        }
      } catch (err) {
        console.warn(
          "No se pudo obtener el archivo maestro limpio del servidor:",
          err,
        );
      }
    }

    if (!imageSrc) {
      imageSrc = item.generated_art_url || "/samples/cat-suit.jpg";
    }

    const bleedSpec = resolvePrintBleedSpec(
      {
        sizeId: item.customizations?.size_id,
        cmDimensions:
          item.customizations?.cm_dimensions || item.customizations?.size_label,
      },
      CANVAS_WRAP_BLEED_CM,
    );

    const finishMode =
      item.customizations?.finish_mode === "museum-matte"
        ? "museum-matte"
        : "full-bleed";

    const inscriptionPetName =
      (item.customizations?.pet_inscription?.enabled &&
        item.customizations?.pet_inscription?.pet_name?.trim()) ||
      item.customizations?.pet_name?.trim() ||
      null;

    try {
      const exported = await exportPrintReadyImage(
        imageSrc,
        bleedSpec.preset,
        finishMode,
        CANVAS_WRAP_BLEED_CM,
        inscriptionPetName,
      );

      const fileName = `Orden-${order.order_code}-cuadro-${bleedSpec.faceWidthCm}x${bleedSpec.faceHeightCm}cm-impresion-${bleedSpec.totalWidthCm}x${bleedSpec.totalHeightCm}cm-300DPI.png`;

      if (exported.blob) {
        const blobUrl = URL.createObjectURL(exported.blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else {
        const link = document.createElement("a");
        link.href = exported.dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      showToast(
        "success",
        `Archivo Maestro HD descargado en ${bleedSpec.totalCmLabel} (+${CANVAS_WRAP_BLEED_CM} cm en los 4 lados para remangado).`,
      );
    } catch {
      // Fallback directo si la imagen externa tiene restricción CORS
      window.open(imageSrc, "_blank", "noopener,noreferrer");
      showToast(
        "error",
        "No se pudo procesar en navegador por CORS; se abrió la imagen original en una nueva pestaña.",
      );
    } finally {
      setDownloadingMasterOrderId(null);
    }
  };

  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [editingTrackingOrder, setEditingTrackingOrder] =
    useState<OrderRecord | null>(null);

  const handleOrderUpdated = (updatedOrder: OrderRecord) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    showToast("success", "Expediente de la orden actualizado correctamente.");
  };
  // Filters & Modal for Users
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<
    "all" | "super_admin" | "admin" | "user"
  >("all");
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("user");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Feedback alerts
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const copyTracking = (trackingId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(trackingId);
    setCopiedTrackingId(trackingId);
    setTimeout(() => setCopiedTrackingId(null), 2000);
  };

  const copyDedication = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedDedicationId(id);
    showToast("success", "Dedicatoria copiada al portapapeles.");
    setTimeout(() => setCopiedDedicationId(null), 2500);
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (res.status === 401) {
        window.location.replace("/auth/login?callbackUrl=/dashboard");
        return;
      }
      if (res.status === 403 || !res.ok) {
        window.location.replace("/orders");
        return;
      }
      const data = await res.json();
      if (!data?.currentUser || !isAdminRole(data.currentUser.role)) {
        window.location.replace("/orders");
        return;
      }
      setCurrentUser(data.currentUser);
      setCachedSessionUser(data.currentUser);
      setOrders(data.orders || []);
      setUsers(data.users || []);
      setEmailQueue(data.emailQueue || []);
      setIsResendConfigured(Boolean(data.is_resend_configured));
      setProducts(data.products || []);
      setSettings(data.settings || null);
      if (data.settings?.ADMIN_NOTIFICATION_EMAILS?.emails) {
        setAdminEmailsInput(
          data.settings.ADMIN_NOTIFICATION_EMAILS.emails.join(", "),
        );
      }
      if (data.settings?.ADMIN_NOTIFICATION_EMAILS?.supplier_email) {
        setSupplierEmailInput(
          data.settings.ADMIN_NOTIFICATION_EMAILS.supplier_email,
        );
      }
    } catch {
      window.location.replace("/orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryPendingEmails = async (emailId?: string) => {
    if (emailId) {
      setRetryingEmailId(emailId);
    } else {
      setIsRetryingEmails(true);
    }
    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(
          "error",
          data.error || "Error al procesar la cola de correos.",
        );
        return;
      }
      if (data.result?.is_configured === false) {
        showToast(
          "error",
          "RESEND_API_KEY no configurada. Agrega tu clave en el archivo .env o en Vercel.",
        );
      } else if (data.result?.sent > 0) {
        showToast(
          "success",
          `Se enviaron ${data.result.sent} correos correctamente.`,
        );
        loadAdminData();
      } else if (data.result?.errors?.length > 0) {
        showToast("error", data.result.errors[0]);
        loadAdminData();
      } else {
        showToast("success", "No hay correos pendientes con intentos restantes.");
      }
    } catch (e: any) {
      showToast("error", e?.message || "Error al reintentar correos.");
    } finally {
      setIsRetryingEmails(false);
      setRetryingEmailId(null);
    }
  };

  const loadAiHealth = async () => {
    try {
      const res = await fetch("/api/admin/ai-health", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAiHealthData(data);
      }
    } catch {}
  };

  const handleResolveAiAlert = async () => {
    setIsResolvingAiAlert(true);
    try {
      const res = await fetch("/api/admin/ai-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve_alert" }),
      });
      if (res.ok) {
        showToast("success", "Alerta de créditos IA marcada como resuelta.");
        await loadAiHealth();
      }
    } catch {
      showToast("error", "No se pudo actualizar la alerta.");
    } finally {
      setIsResolvingAiAlert(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    loadAiHealth();
  }, []);

  const isSuperAdmin = currentUser?.role === "super_admin";

  // ============================================================================
  // 1. GESTIÓN DE ÓRDENES, PRIORIZACIÓN OPERATIVA Y MODAL DE DETALLE
  // ============================================================================
  type OrderLifecycleAction =
    | "verify_advance_50"
    | "set_step_manufacturing"
    | "set_step_in_transit"
    | "set_step_delivered"
    | "complete_final_50_payment"
    | "cancel_order";

  // Ejecución real (lógica original, sin cambios)
  const executeOrderLifecycleAction = async (
    orderId: string,
    action: OrderLifecycleAction,
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? data.order : o)),
        );
        showToast("success", "Estado de la orden actualizado correctamente.");
      } else {
        showToast("error", data.error || "No se pudo actualizar la orden.");
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Wrapper: abre el modal de confirmación y ejecuta solo en onConfirm
  const handleOrderLifecycleAction = async (
    orderId: string,
    action: OrderLifecycleAction,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();

    const orderCode =
      orders.find((o) => o.id === orderId)?.order_code || "esta orden";

    if (action === "verify_advance_50") {
      const targetOrder = orders.find((o) => o.id === orderId);
      const isFullOrder = Number(targetOrder?.remaining_amount || 0) <= 0;
      setConfirmModalData({
        open: true,
        title: "Aprobar Pago",
        description: isFullOrder
          ? `¿Confirmas que el pago del 100% (S/ ${Number(targetOrder?.total_amount || 0).toFixed(2)}) de la orden ${orderCode} fue recibido y deseas aprobarlo?`
          : `¿Confirmas que el adelanto del 50% de la orden ${orderCode} fue recibido y deseas aprobarlo?`,
        variant: "success",
        action: async () => {
          await executeOrderLifecycleAction(orderId, action);
        },
      });
      return;
    }

    if (
      action === "set_step_manufacturing" ||
      action === "set_step_in_transit" ||
      action === "set_step_delivered"
    ) {
      const stepLabel =
        action === "set_step_manufacturing"
          ? "En Fabricación"
          : action === "set_step_in_transit"
            ? "En Camino"
            : "Entregado";
      setConfirmModalData({
        open: true,
        title: "Actualizar Estado de Orden",
        description: `¿Deseas cambiar el estado de la orden ${orderCode} a "${stepLabel}"? El cliente verá el cambio en su seguimiento.`,
        variant: "default",
        action: async () => {
          await executeOrderLifecycleAction(orderId, action);
        },
      });
      return;
    }

    // complete_final_50_payment y cancel_order: comportamiento original (sin modal)
    await executeOrderLifecycleAction(orderId, action);
  };

  // Ordenamiento inteligente: Primero las órdenes pendientes/recientes urgentes, luego por fecha más reciente
  const prioritizedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const priorityDiff =
        getOrderOperationalPriority(a) - getOrderOperationalPriority(b);
      if (priorityDiff !== 0) return priorityDiff;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return prioritizedOrders.filter((order) => {
      if (orderStatusFilter === "active_pending") {
        if (
          order.status === "delivered" ||
          order.status === "completed" ||
          order.status === "cancelled"
        ) {
          return false;
        }
      } else if (orderStatusFilter === "delivered") {
        if (order.status !== "delivered" && order.status !== "completed") {
          return false;
        }
      } else if (orderStatusFilter !== "priority_all") {
        if (order.status !== orderStatusFilter) return false;
      }

      const q = orderSearch.trim().toLowerCase();
      if (!q) return true;

      return (
        order.tracking_id.toLowerCase().includes(q) ||
        order.order_code.toLowerCase().includes(q) ||
        (order.shipping?.name || "").toLowerCase().includes(q) ||
        (order.shipping?.email || "").toLowerCase().includes(q) ||
        (order.shipping?.phone || "").toLowerCase().includes(q) ||
        (order.shipping?.district || "").toLowerCase().includes(q)
      );
    });
  }, [prioritizedOrders, orderSearch, orderStatusFilter]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  // ============================================================================
  // 2. GESTIÓN DE USUARIOS Y JERARQUÍA RBAC
  // ============================================================================
  const handleUpdateUser = async (
    userId: string,
    updates: { role?: UserRole; is_active?: boolean },
  ) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
        showToast("success", "Perfil de usuario actualizado.");
      } else {
        showToast("error", data.error || "Error al actualizar el usuario.");
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          phone: newUserPhone,
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUsers((prev) => [data.user, ...prev]);
        setShowCreateUserModal(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPhone("");
        setNewUserPassword("");
        setNewUserRole("user");
        showToast(
          "success",
          `Usuario ${data.user.email} creado con rol ${data.user.role}.`,
        );
      } else {
        showToast("error", data.error || "No se pudo crear el usuario.");
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
      if (!matchesRole) return false;

      const q = userSearch.trim().toLowerCase();
      if (!q) return true;

      return (
        (u.name || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
      );
    });
  }, [users, userSearch, userRoleFilter]);

  // ============================================================================
  // 3. CONFIGURACIÓN DINÁMICA DEL SERVICIO "CUADROS PERSONALIZADOS"
  // ============================================================================
  const wallArtProduct = useMemo(() => {
    return (
      products.find(
        (p) =>
          p.slug === "cuadros-personalizados" ||
          p.slug === "personalized-wall-art" ||
          p.category === "wall_art",
      ) ||
      products[0] ||
      null
    );
  }, [products]);

  const wallArtConfig: ProductCustomizationConfig = useMemo(() => {
    const raw = wallArtProduct?.customization_config;
    if (!raw) {
      return {
        characters: [],
        sizes: [],
        frames: [],
        finishes: [],
      };
    }

    // Deduplicación estricta por ID único para evitar colisiones en React reconciler
    const seenCharIds = new Set<string>();
    const uniqueChars = (raw.characters || []).filter((c) => {
      if (!c.id || seenCharIds.has(c.id)) return false;
      seenCharIds.add(c.id);
      return true;
    });

    const seenFrameIds = new Set<string>();
    const uniqueFrames = (raw.frames || []).filter((f) => {
      if (!f.id || seenFrameIds.has(f.id)) return false;
      seenFrameIds.add(f.id);
      return true;
    });

    const seenSizeIds = new Set<string>();
    const uniqueSizes = (raw.sizes || []).filter((s) => {
      if (!s.id || seenSizeIds.has(s.id)) return false;
      seenSizeIds.add(s.id);
      return true;
    });

    return {
      characters: uniqueChars,
      sizes: uniqueSizes,
      frames: uniqueFrames,
      finishes: raw.finishes || [],
    };
  }, [wallArtProduct]);

  const persistWallArtConfig = async (
    nextConfig: ProductCustomizationConfig,
    successMessage: string,
  ) => {
    if (!wallArtProduct) return;
    setIsSavingCuadros(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: wallArtProduct.id,
          productUpdate: {
            customization_config: nextConfig,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.product) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === wallArtProduct.id || p.slug === data.product.slug
              ? data.product
              : p,
          ),
        );
        showToast("success", successMessage);
      } else {
        showToast(
          "error",
          data.error ||
            "No se pudo guardar la configuración de Cuadros Personalizados.",
        );
      }
    } catch {
      showToast(
        "error",
        "Error de red al guardar la configuración de Cuadros Personalizados.",
      );
    } finally {
      setIsSavingCuadros(false);
    }
  };

  const handleImageFileToDataUrl = (
    file: File,
    onLoaded: (dataUrl: string) => void,
  ) => {
    if (!file.type.startsWith("image/")) {
      showToast("error", "Selecciona una imagen válida (JPG, PNG o WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 900;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          onLoaded(canvas.toDataURL("image/jpeg", 0.85));
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- Análisis Multimodal IA para Autocompletar Personaje (Costo $0) ---
  const handleAnalyzeCharacterImage = async (
    dataUrl: string,
    fileName?: string,
  ) => {
    if (!dataUrl) return;
    setIsAnalyzingCharacter(true);
    setAnalysisSuccessMsg(null);
    setAnalysisErrorMsg(null);

    try {
      const res = await fetch("/api/admin/analyze-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          fileName: fileName || "personaje.jpg",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudo analizar la imagen.");
      }

      const { data, source } = json;
      setCharForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        characterTitle: data.characterTitle || prev.characterTitle,
        universe: data.universe || prev.universe,
        description: data.description || prev.description,
        prompt: data.prompt || prev.prompt,
        negativePrompt: data.negativePrompt || prev.negativePrompt,
        characterImageUrl: dataUrl,
        fusionSampleUrl:
          !prev.fusionSampleUrl ||
          prev.fusionSampleUrl === "/samples/cat-suit.jpg"
            ? dataUrl
            : prev.fusionSampleUrl,
      }));

      setAnalysisSuccessMsg(
        source === "gemini-flash-free" || source === "openai-mini-vision"
          ? "¡Vestuario analizado con IA de Visión! Campos autocompletados con precisión. Puedes editarlos libremente."
          : "¡Campos autocompletados con IA local! Puedes editarlos libremente.",
      );
    } catch (err: any) {
      console.error("Error analyzing character image:", err);
      setAnalysisErrorMsg(
        err?.message ||
          "No se pudo autocompletar con IA automáticamente. Puedes completar los campos manualmente.",
      );
    } finally {
      setIsAnalyzingCharacter(false);
    }
  };

  // --- CRUD Personajes / Escenas IA ---
  const openCreateCharacterModal = () => {
    setEditingCharacterId(null);
    setAnalysisSuccessMsg(null);
    setAnalysisErrorMsg(null);
    setShowAdvancedSample(false);
    setCharForm({
      id: `char-${Date.now().toString().slice(-5)}`,
      name: "",
      characterTitle: "",
      universe: "Colección Apolena",
      description: "",
      accentColor: "bg-terracotta-500",
      tagColor: "bg-white/90 text-stone-800 border-stone-200/80",
      maskUrl: "/masks/default-mask.png",
      characterImageUrl: "",
      fusionSampleUrl: "",
      prompt: "",
      negativePrompt:
        "human face, human hands, cartoon, illustration, low quality, blurry, deformed eyes",
      isAvailable: true,
    });
    setShowCharacterModal(true);
  };

  const openEditCharacterModal = (char: FamousCharacter) => {
    setEditingCharacterId(char.id);
    setAnalysisSuccessMsg(null);
    setAnalysisErrorMsg(null);
    setShowAdvancedSample(false);
    setCharForm({
      ...char,
      isAvailable: char.isAvailable !== false,
    });
    setShowCharacterModal(true);
  };

  const handleSaveCharacterForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charForm.characterImageUrl) {
      showToast(
        "error",
        "Por favor, sube o selecciona una imagen para el personaje.",
      );
      return;
    }

    const currentChars = wallArtConfig.characters || [];

    const baseSlug =
      charForm.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || `char-${Date.now().toString().slice(-4)}`;

    let cleanId = editingCharacterId;
    if (!cleanId) {
      let candidateId = baseSlug;
      let counter = 1;
      while (currentChars.some((c) => c.id === candidateId)) {
        candidateId = `${baseSlug}-${counter++}`;
      }
      cleanId = candidateId;
    }

    const characterRecord: FamousCharacter = {
      ...charForm,
      id: cleanId,
      characterTitle:
        charForm.characterTitle || charForm.name || "Colección Apolena",
      universe: charForm.universe || "Colección Apolena",
      fusionSampleUrl: charForm.fusionSampleUrl || charForm.characterImageUrl,
      maskUrl: charForm.maskUrl || "/masks/default-mask.png",
      tagColor:
        charForm.tagColor || "bg-white/90 text-stone-800 border-stone-200/80",
      accentColor: charForm.accentColor || "bg-terracotta-500",
      negativePrompt:
        charForm.negativePrompt ||
        "human face, human hands, cartoon, illustration, low quality, blurry, deformed eyes",
    };

    const nextCharacters = editingCharacterId
      ? currentChars.map((c) =>
          c.id === editingCharacterId ? characterRecord : c,
        )
      : [characterRecord, ...currentChars.filter((c) => c.id !== cleanId)];

    setShowCharacterModal(false);
    await persistWallArtConfig(
      {
        ...wallArtConfig,
        characters: nextCharacters,
      },
      editingCharacterId
        ? `Personaje "${characterRecord.name}" actualizado.`
        : `Personaje "${characterRecord.name}" agregado al Estudio IA.`,
    );
  };

  const [draggedCharIndex, setDraggedCharIndex] = useState<number | null>(null);
  const [dragOverCharIndex, setDragOverCharIndex] = useState<number | null>(
    null,
  );

  const handleDropCharacter = async (targetIdx: number) => {
    if (
      draggedCharIndex === null ||
      draggedCharIndex === targetIdx ||
      isSavingCuadros
    ) {
      setDraggedCharIndex(null);
      setDragOverCharIndex(null);
      return;
    }

    const currentChars = [...(wallArtConfig.characters || [])];
    if (
      draggedCharIndex < 0 ||
      draggedCharIndex >= currentChars.length ||
      targetIdx < 0 ||
      targetIdx >= currentChars.length
    ) {
      setDraggedCharIndex(null);
      setDragOverCharIndex(null);
      return;
    }

    const [moved] = currentChars.splice(draggedCharIndex, 1);
    currentChars.splice(targetIdx, 0, moved);
    setDraggedCharIndex(null);
    setDragOverCharIndex(null);

    await persistWallArtConfig(
      {
        ...wallArtConfig,
        characters: currentChars,
      },
      `Orden actualizado: "${moved.name}" pasó a la posición #${targetIdx + 1}.`,
    );
  };

  const handleToggleCharacterAvailability = async (charId: string) => {
    const nextCharacters = (wallArtConfig.characters || []).map((c) =>
      c.id === charId ? { ...c, isAvailable: c.isAvailable === false } : c,
    );
    await persistWallArtConfig(
      {
        ...wallArtConfig,
        characters: nextCharacters,
      },
      "Visibilidad del personaje actualizada.",
    );
  };
const handleDeleteCharacter = (charId: string, charName: string) => {
    const currentChars = wallArtConfig.characters || [];
    if (currentChars.length <= 1) {
      showToast(
        "error",
        "El estudio debe conservar al menos 1 personaje activo."
      );
      return;
    }

    // Abre el modal para pedir confirmación
    setConfirmModalData({
      open: true,
      title: "Eliminar Personaje",
      description: `¿Estás seguro de que deseas eliminar el personaje "${charName}" del catálogo? Esta acción no se puede deshacer.`,
      variant: "destructive",
      action: async () => {
        const nextCharacters = currentChars.filter((c) => c.id !== charId);
        await persistWallArtConfig(
          {
            ...wallArtConfig,
            characters: nextCharacters,
          },
          `Personaje "${charName}" eliminado del catálogo.`
        );
      },
    });
  };
  // --- CRUD Marcos de Cuadros ---
  const getNormalizedFrameImages = (frame: FrameOption): string[] => {
    if (Array.isArray(frame.images) && frame.images.length > 0) {
      return frame.images.filter((url): url is string => Boolean(url?.trim()));
    }
    if (frame.imageUrl?.trim()) {
      return [frame.imageUrl.trim()];
    }
    return [];
  };

  const openCreateFrameModal = () => {
    setEditingFrameId(null);
    setFrameForm({
      id: `frame-${Date.now().toString().slice(-5)}`,
      name: "",
      description: "",
      priceModifierPen: 45,
      colorHex: "#5C3A21",
      imageUrl: null,
      images: [],
      isAvailable: true,
    });
    setShowFrameModal(true);
  };

  const openEditFrameModal = (frame: FrameOption) => {
    const imgs = getNormalizedFrameImages(frame);
    setEditingFrameId(frame.id);
    setFrameForm({
      ...frame,
      imageUrl: imgs[0] || null,
      images: imgs,
      isAvailable: frame.isAvailable !== false,
    });
    setShowFrameModal(true);
  };

  const handleAddFrameModalImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      handleImageFileToDataUrl(file, (dataUrl) => {
        setFrameForm((prev) => {
          const currentImgs = getNormalizedFrameImages(prev);
          const nextImgs = [...currentImgs, dataUrl];
          return {
            ...prev,
            images: nextImgs,
            imageUrl: nextImgs[0] || null,
          };
        });
      });
    });
  };

  const handleReplaceFrameModalImage = (index: number, file: File | null) => {
    if (!file) return;
    handleImageFileToDataUrl(file, (dataUrl) => {
      setFrameForm((prev) => {
        const currentImgs = getNormalizedFrameImages(prev);
        const nextImgs = [...currentImgs];
        nextImgs[index] = dataUrl;
        return {
          ...prev,
          images: nextImgs,
          imageUrl: nextImgs[0] || null,
        };
      });
    });
  };

  const handleRemoveFrameModalImage = (index: number) => {
    setFrameForm((prev) => {
      const currentImgs = getNormalizedFrameImages(prev);
      const nextImgs = currentImgs.filter((_, idx) => idx !== index);
      return {
        ...prev,
        images: nextImgs,
        imageUrl: nextImgs[0] || null,
      };
    });
  };

  const handleDirectUploadFrameImages = (
    frame: FrameOption,
    files: FileList | null,
  ) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const loadedUrls: string[] = [];
    fileArray.forEach((file) => {
      handleImageFileToDataUrl(file, async (dataUrl) => {
        loadedUrls.push(dataUrl);
        if (loadedUrls.length === fileArray.length) {
          const currentImgs = getNormalizedFrameImages(frame);
          const nextImgs = [...currentImgs, ...loadedUrls];
          const nextFrames = (wallArtConfig.frames || []).map((f) =>
            f.id === frame.id
              ? { ...f, images: nextImgs, imageUrl: nextImgs[0] || null }
              : f,
          );
          await persistWallArtConfig(
            {
              ...wallArtConfig,
              frames: nextFrames,
            },
            `Imagen agregada al marco "${frame.name}".`,
          );
        }
      });
    });
  };

  const handleDirectReplaceFrameImage = (
    frame: FrameOption,
    imgIndex: number,
    file: File | null,
  ) => {
    if (!file) return;
    handleImageFileToDataUrl(file, async (dataUrl) => {
      const currentImgs = getNormalizedFrameImages(frame);
      const nextImgs = [...currentImgs];
      nextImgs[imgIndex] = dataUrl;
      const nextFrames = (wallArtConfig.frames || []).map((f) =>
        f.id === frame.id
          ? { ...f, images: nextImgs, imageUrl: nextImgs[0] || null }
          : f,
      );
      await persistWallArtConfig(
        {
          ...wallArtConfig,
          frames: nextFrames,
        },
        `Imagen del marco "${frame.name}" actualizada.`,
      );
    });
  };

  const handleDirectRemoveFrameImage = async (
    frame: FrameOption,
    imgIndex: number,
  ) => {
    const currentImgs = getNormalizedFrameImages(frame);
    const nextImgs = currentImgs.filter((_, idx) => idx !== imgIndex);
    const nextFrames = (wallArtConfig.frames || []).map((f) =>
      f.id === frame.id
        ? { ...f, images: nextImgs, imageUrl: nextImgs[0] || null }
        : f,
    );
    await persistWallArtConfig(
      {
        ...wallArtConfig,
        frames: nextFrames,
      },
      `Imagen eliminada del marco "${frame.name}".`,
    );
  };

  const handleSaveFrameForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentFrames = wallArtConfig.frames || [];
    const cleanId =
      editingFrameId ||
      `frame-${frameForm.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}`;

    const normalizedImgs = getNormalizedFrameImages(frameForm);
    const frameRecord: FrameOption = {
      ...frameForm,
      id: cleanId,
      priceModifierPen: Number(frameForm.priceModifierPen) || 0,
      images: normalizedImgs,
      imageUrl: normalizedImgs[0] || null,
    };

    const nextFrames = editingFrameId
      ? currentFrames.map((f) => (f.id === editingFrameId ? frameRecord : f))
      : [...currentFrames, frameRecord];

    setShowFrameModal(false);
    await persistWallArtConfig(
      {
        ...wallArtConfig,
        frames: nextFrames,
      },
      editingFrameId
        ? `Marco "${frameRecord.name}" actualizado.`
        : `Marco "${frameRecord.name}" agregado a Cuadros Personalizados.`,
    );
  };

  const handleToggleFrameAvailability = async (frameId: string) => {
    const nextFrames = (wallArtConfig.frames || []).map((f) =>
      f.id === frameId ? { ...f, isAvailable: f.isAvailable === false } : f,
    );
    await persistWallArtConfig(
      {
        ...wallArtConfig,
        frames: nextFrames,
      },
      "Disponibilidad del marco actualizada.",
    );
  };

  const handleDeleteFrame = async (frameId: string, frameName: string) => {
    const currentFrames = wallArtConfig.frames || [];
    if (currentFrames.length <= 1) {
      showToast(
        "error",
        "El servicio debe tener al menos 1 opción de marco o bastidor.",
      );
      return;
    }
    const nextFrames = currentFrames.filter((f) => f.id !== frameId);
    await persistWallArtConfig(
      {
        ...wallArtConfig,
        frames: nextFrames,
      },
      `Marco "${frameName}" eliminado.`,
    );
  };

  // --- CRUD Medidas de Cuadros (300 DPI) ---
  const openCreateSizeModal = () => {
    setEditingSizeId(null);
    setSizeForm({
      id: `size-${Date.now().toString().slice(-5)}`,
      tier: "Especial",
      label: "45 × 60 cm",
      cmDimensions: "45 × 60 cm",
      inchDimensions: '18 × 24"',
      dpi: 300,
      baseWidthPx: 5315,
      baseHeightPx: 7087,
      recommendedUse: "Salas principales y dormitorios amplios",
      pricePen: 210,
      compareAtPricePen: 230,
      isAvailable: true,
    });
    setShowSizeModal(true);
  };

  const openEditSizeModal = (preset: PrintPreset) => {
    setEditingSizeId(preset.id);
    setSizeForm({
      ...preset,
      compareAtPricePen: preset.compareAtPricePen,
      isAvailable: preset.isAvailable !== false,
    });
    setShowSizeModal(true);
  };

  const handleSaveSizeForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentSizes = wallArtConfig.sizes || [];
    const cleanId =
      editingSizeId ||
      `size-${sizeForm.cmDimensions
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}`;

    const sizeRecord: PrintPreset = {
      ...sizeForm,
      id: cleanId,
      label: sizeForm.cmDimensions,
      dpi: Number(sizeForm.dpi) || 300,
      baseWidthPx: Number(sizeForm.baseWidthPx) || 3543,
      baseHeightPx: Number(sizeForm.baseHeightPx) || 4724,
      pricePen: Number(sizeForm.pricePen) || 0,
      compareAtPricePen: sizeForm.compareAtPricePen
        ? Number(sizeForm.compareAtPricePen)
        : undefined,
      isAvailable: sizeForm.isAvailable !== false,
    };

    const nextSizes = editingSizeId
      ? currentSizes.map((s) => (s.id === editingSizeId ? sizeRecord : s))
      : [...currentSizes, sizeRecord];

    setShowSizeModal(false);
    await persistWallArtConfig(
      {
        ...wallArtConfig,
        sizes: nextSizes,
      },
      editingSizeId
        ? `Medida "${sizeRecord.tier} (${sizeRecord.cmDimensions})" actualizada.`
        : `Medida "${sizeRecord.tier} (${sizeRecord.cmDimensions})" agregada.`,
    );
  };

  const handleToggleSizeAvailability = async (sizeId: string) => {
    const nextSizes = (wallArtConfig.sizes || []).map((s) =>
      s.id === sizeId ? { ...s, isAvailable: s.isAvailable === false } : s,
    );
    await persistWallArtConfig(
      {
        ...wallArtConfig,
        sizes: nextSizes,
      },
      "Disponibilidad de la medida actualizada.",
    );
  };

  const handleDeleteSize = async (sizeId: string, sizeLabel: string) => {
    const currentSizes = wallArtConfig.sizes || [];
    if (currentSizes.length <= 1) {
      showToast("error", "El servicio debe tener al menos 1 medida activa.");
      return;
    }
    const nextSizes = currentSizes.filter((s) => s.id !== sizeId);
    await persistWallArtConfig(
      {
        ...wallArtConfig,
        sizes: nextSizes,
      },
      `Medida "${sizeLabel}" eliminada.`,
    );
  };

  // --- Acabados de Lienzo (Full Bleed / Paspartú) ---
  const handleUpdateFinishField = (
    finishId: string,
    updates: Partial<ProductFinishOption>,
  ) => {
    if (!wallArtProduct) return;
    const nextFinishes = (wallArtConfig.finishes || []).map((fin) =>
      fin.id === finishId ? { ...fin, ...updates } : fin,
    );
    setProducts((prev) =>
      prev.map((p) =>
        p.id === wallArtProduct.id
          ? {
              ...p,
              customization_config: {
                ...wallArtConfig,
                finishes: nextFinishes,
              },
            }
          : p,
      ),
    );
  };

  // ============================================================================
  // 4. CONFIGURACIÓN GLOBAL DE APOLENA (platform_settings)
  // ============================================================================
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const parsedEmails = adminEmailsInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.includes("@"));
    const cleanSupplierEmail = supplierEmailInput.trim().includes("@")
      ? supplierEmailInput.trim().toLowerCase()
      : "mariano260996@gmail.com";
    const nextSettings = {
      ...settings,
      ADMIN_NOTIFICATION_EMAILS: {
        ...settings.ADMIN_NOTIFICATION_EMAILS,
        emails:
          parsedEmails.length > 0 ? parsedEmails : ["apolenaperu@gmail.com"],
        supplier_email: cleanSupplierEmail,
      },
    };
    setSettings(nextSettings);
    setAdminEmailsInput(nextSettings.ADMIN_NOTIFICATION_EMAILS.emails.join(", "));
    setSupplierEmailInput(cleanSupplierEmail);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: nextSettings }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(
        "success",
        "Configuración global de Apolena guardada en platform_settings.",
      );
    } else {
      showToast(
        "error",
        data.error || "No tienes permisos para editar la configuración global.",
      );
    }
  };

  const handleConfirmDeleteOrder = async () => {
    if (!deletingOrder) return;
    setIsDeletingOrder(true);
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(deletingOrder.id)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "No se pudo eliminar la orden.");
        return;
      }
      const deletedId = deletingOrder.id;
      const deletedCode = deletingOrder.order_code;
      const deletedTracking = deletingOrder.tracking_id;
      setOrders((prev) => prev.filter((o) => o.id !== deletedId));
      setEmailQueue((prev) =>
        prev.filter(
          (e) =>
            !e.subject.includes(deletedCode) &&
            !e.subject.includes(deletedTracking),
        ),
      );
      if (selectedOrderId === deletedId) {
        setSelectedOrderId(null);
      }
      setDeletingOrder(null);
      showToast(
        "success",
        `Orden ${deletedCode} y todo su contenido relacionado fueron eliminados.`,
      );
    } catch {
      showToast("error", "Error de conexión al eliminar la orden.");
    } finally {
      setIsDeletingOrder(false);
    }
  };

  // KPI Counters
  const totalPending = orders.filter((o) => o.status === "pending").length;
  const totalManufacturing = orders.filter(
    (o) => o.status === "manufacturing",
  ).length;
  const totalInTransit = orders.filter((o) => o.status === "in_transit").length;
  const totalDelivered = orders.filter(
    (o) => o.status === "delivered" || o.status === "completed",
  ).length;
  const totalActivePending =
    totalPending + totalManufacturing + totalInTransit;
  const totalUnverifiedAdvance = orders.filter(
    (o) => o.payment_status === "partial_pending" && o.status !== "cancelled",
  ).length;
  const totalRevenuePen = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

  // Guardia estricta en cliente: Jamás renderizar el Dashboard Administrativo si no es admin o super_admin verificado
  if (isLoading || !currentUser || !isAdminRole(currentUser.role)) {
    return (
      <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="bg-white border border-cream-200 rounded-3xl p-10 text-center space-y-3 shadow-soft max-w-sm w-full">
            <Loader2 className="w-6 h-6 animate-spin text-terracotta-500 mx-auto" />
            <p className="text-xs font-medium text-stone-500">
              Verificando permisos de acceso...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10 w-full space-y-7">
        {/* Global Toast Feedback */}
        {feedbackMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-hover border text-xs font-semibold transition-all ${
              feedbackMessage.type === "success"
                ? "bg-stone-900 text-white border-stone-800"
                : "bg-rose-600 text-white border-rose-500"
            }`}
          >
            {feedbackMessage.type === "success" ? (
              <Check className="w-4 h-4 text-terracotta-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* CABECERA MINIMALISTA DEL DASHBOARD                                */}
        {/* ================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Dashboard Administrativo
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-terracotta-500 text-white text-[11px] font-bold">
              {isSuperAdmin ? (
                <Crown className="w-3 h-3" />
              ) : (
                <ShieldCheck className="w-3 h-3" />
              )}
              <span>{isSuperAdmin ? "Super Admin" : "Admin"}</span>
            </span>
            <span className="text-xs text-stone-400 font-mono hidden md:inline">
              · {currentUser.email}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-cream-100 text-stone-700 text-xs font-semibold transition-all flex items-center gap-1.5 border border-cream-200 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-terracotta-500" />
              <span>Mis Órdenes</span>
            </Link>
            <Link
              href="/products/cuadros-personalizados"
              className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-terracotta-400" />
              <span>Estudio IA</span>
            </Link>
          </div>
        </div>

        {/* ================================================================= */}
        {/* KPI METRICS STRIP (INTERACTIVE FILTERS)                           */}
        {/* ================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("orders");
              setOrderStatusFilter("pending");
            }}
            className={`text-left bg-white border rounded-2xl p-4 sm:p-5 shadow-soft transition-all hover:border-amber-400 cursor-pointer ${
              orderStatusFilter === "pending" && activeTab === "orders"
                ? "border-amber-500 ring-2 ring-amber-500/15"
                : "border-amber-200"
            }`}
          >
            <span className="text-[11px] font-semibold text-amber-800 block">
              Pendientes
            </span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-amber-700 mt-1">
              {totalPending}
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("orders");
              setOrderStatusFilter("manufacturing");
            }}
            className={`text-left bg-white border rounded-2xl p-4 sm:p-5 shadow-soft transition-all hover:border-terracotta-400 cursor-pointer ${
              orderStatusFilter === "manufacturing" && activeTab === "orders"
                ? "border-terracotta-500 ring-2 ring-terracotta-500/15"
                : "border-cream-200"
            }`}
          >
            <span className="text-[11px] font-medium text-stone-500 block">
              En Fabricación
            </span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              {totalManufacturing}
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("orders");
              setOrderStatusFilter("in_transit");
            }}
            className={`text-left bg-white border rounded-2xl p-4 sm:p-5 shadow-soft transition-all hover:border-terracotta-400 cursor-pointer ${
              orderStatusFilter === "in_transit" && activeTab === "orders"
                ? "border-terracotta-500 ring-2 ring-terracotta-500/15"
                : "border-cream-200"
            }`}
          >
            <span className="text-[11px] font-medium text-stone-500 block">
              En Camino
            </span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              {totalInTransit}
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("orders");
              setOrderStatusFilter("delivered");
            }}
            className={`text-left bg-white border rounded-2xl p-4 sm:p-5 shadow-soft transition-all hover:border-sage-400 cursor-pointer ${
              orderStatusFilter === "delivered" && activeTab === "orders"
                ? "border-sage-600 ring-2 ring-sage-600/15"
                : "border-sage-200"
            }`}
          >
            <span className="text-[11px] font-semibold text-sage-700 block">
              Entregados
            </span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-sage-700 mt-1">
              {totalDelivered}
            </p>
          </button>

          <div className="col-span-2 sm:col-span-1 bg-white border border-cream-200 rounded-2xl p-4 sm:p-5 shadow-soft">
            <span className="text-[11px] font-medium text-stone-500 block">
              Volumen Total Órdenes
            </span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              S/ {totalRevenuePen.toFixed(0)}
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BARRA DE PESTAÑAS DEL DASHBOARD (FUERA DEL CARD AZUL)             */}
        {/* ================================================================= */}
        <div className="border-b border-cream-200">
          <div className="flex flex-nowrap items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`relative px-3 lg:px-3.5 py-2.5 text-xs font-semibold transition-all flex items-center gap-1.5 rounded-t-xl border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "orders"
                  ? "border-terracotta-500 text-stone-900 bg-white shadow-xs"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-white/60"
              }`}
            >
              <Hammer
                className={`w-3.5 h-3.5 shrink-0 ${
                  activeTab === "orders"
                    ? "text-terracotta-500"
                    : "text-stone-400"
                }`}
              />
              <span>Gestión de Órdenes</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "orders"
                    ? "bg-terracotta-500 text-white"
                    : "bg-cream-200 text-stone-700"
                }`}
              >
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cuadros")}
              className={`relative px-3 lg:px-3.5 py-2.5 text-xs font-semibold transition-all flex items-center gap-1.5 rounded-t-xl border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "cuadros"
                  ? "border-terracotta-500 text-stone-900 bg-white shadow-xs"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-white/60"
              }`}
            >
              <Frame
                className={`w-3.5 h-3.5 shrink-0 ${
                  activeTab === "cuadros"
                    ? "text-terracotta-500"
                    : "text-stone-400"
                }`}
              />
              <span>Cuadros Personalizados</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "cuadros"
                    ? "bg-terracotta-500 text-white"
                    : "bg-cream-200 text-stone-700"
                }`}
              >
                {(wallArtConfig.characters?.length || 0) +
                  (wallArtConfig.frames?.length || 0)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`relative px-3 lg:px-3.5 py-2.5 text-xs font-semibold transition-all flex items-center gap-1.5 rounded-t-xl border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "users"
                  ? "border-terracotta-500 text-stone-900 bg-white shadow-xs"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-white/60"
              }`}
            >
              <Users
                className={`w-3.5 h-3.5 shrink-0 ${
                  activeTab === "users"
                    ? "text-terracotta-500"
                    : "text-stone-400"
                }`}
              />
              <span>Usuarios y Roles</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "users"
                    ? "bg-terracotta-500 text-white"
                    : "bg-cream-200 text-stone-700"
                }`}
              >
                {users.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`relative px-3 lg:px-3.5 py-2.5 text-xs font-semibold transition-all flex items-center gap-1.5 rounded-t-xl border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "settings"
                  ? "border-terracotta-500 text-stone-900 bg-white shadow-xs"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-white/60"
              }`}
            >
              <Settings
                className={`w-3.5 h-3.5 shrink-0 ${
                  activeTab === "settings"
                    ? "text-terracotta-500"
                    : "text-stone-400"
                }`}
              />
              <span>Configuración Apolena</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("emails")}
              className={`relative px-3 lg:px-3.5 py-2.5 text-xs font-semibold transition-all flex items-center gap-1.5 rounded-t-xl border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "emails"
                  ? "border-terracotta-500 text-stone-900 bg-white shadow-xs"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-white/60"
              }`}
            >
              <Mail
                className={`w-3.5 h-3.5 shrink-0 ${
                  activeTab === "emails"
                    ? "text-terracotta-500"
                    : "text-stone-400"
                }`}
              />
              <span>Notificaciones</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "emails"
                    ? "bg-terracotta-500 text-white"
                    : "bg-cream-200 text-stone-700"
                }`}
              >
                {emailQueue.length}
              </span>
            </button>
          </div>
        </div>

        {/* ALERTA CRÍTICA DE CRÉDITOS IA REPORTADA POR USUARIOS */}
        {aiHealthData?.health?.activeAlert && (
          <div className="mb-5 p-4 sm:px-6 rounded-2xl bg-red-50 border-2 border-red-300 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-red-950 text-sm">
                  Alerta de Créditos IA ({aiHealthData.health.lastProvider.toUpperCase()}) ·{" "}
                  {aiHealthData.health.alertCount}{" "}
                  {aiHealthData.health.alertCount === 1 ? "reporte" : "reportes"}
                </p>
                <p className="text-red-800">{aiHealthData.health.lastReason}</p>
                {aiHealthData.health.lastAlertAt && (
                  <p className="text-[11px] text-red-700">
                    Último reporte:{" "}
                    {new Date(aiHealthData.health.lastAlertAt).toLocaleString("es-PE")}{" "}
                    ({aiHealthData.health.lastReporterEmail || "Visitante"})
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://platform.openai.com/settings/organization/billing/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-full bg-white hover:bg-red-100 border border-red-300 text-red-900 text-xs font-bold inline-flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Recargar</span>
              </a>
              <button
                type="button"
                disabled={isResolvingAiAlert}
                onClick={handleResolveAiAlert}
                className="px-4 py-2 rounded-full bg-[#174B3D] hover:bg-[#123B30] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Marcar recargado</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "orders" ? (
          /* ================================================================= */
          /* TAB 1: CARDS RESUMIDAS CON PRIORIDAD + MODAL DE DETALLE COMPLETO  */
          /* ================================================================= */
          <div className="space-y-5">
            {/* Operational Alert Banner when there are orders in "pending" status */}
            {totalPending > 0 ? (
              <div className="bg-terracotta-50 border border-terracotta-200 rounded-2xl p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-terracotta-500 text-white flex items-center justify-center flex-shrink-0 shadow-soft">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-stone-900">
                      Atención Prioritaria: Tienes {totalPending}{" "}
                      {totalPending === 1
                        ? "orden pendiente"
                        : "órdenes pendientes"}{" "}
                      por validar pago y enviar a fabricación
                      {totalUnverifiedAdvance > 0 &&
                        ` (${totalUnverifiedAdvance} por verificar pago)`}
                      .
                    </p>
                    <p className="text-stone-600 mt-0.5">
                      Verifica el comprobante y despacha la orden al proveedor
                      para pasarla automáticamente a En Fabricación.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("pending")}
                  className="px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0 transition-all cursor-pointer"
                >
                  <span>Ver Solo Pendientes ({totalPending})</span>
                </button>
              </div>
            ) : (
              <div className="bg-sage-50/80 border border-sage-200 rounded-2xl p-3.5 sm:px-5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-sage-800">
                  <CheckCircle2 className="w-4 h-4 text-sage-600 flex-shrink-0" />
                  <span>
                    <strong>Todo al día.</strong> No hay órdenes pendientes de
                    validación o despacho al proveedor en este momento.
                  </span>
                </div>
              </div>
            )}

            {/* Search & Priority Filter Bar */}
            <div className="bg-white border border-cream-200 rounded-3xl p-4 sm:p-5 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Buscar por Tracking ID, código de orden, cliente o teléfono..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-stone-900 focus:outline-none focus:border-terracotta-500"
                />
                {orderSearch && (
                  <button
                    type="button"
                    onClick={() => setOrderSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  {
                    id: "priority_all",
                    label: `Todas (${orders.length})`,
                  },
                  {
                    id: "pending",
                    label: `Pendientes (${totalPending})`,
                  },
                  {
                    id: "manufacturing",
                    label: `Fabricación (${totalManufacturing})`,
                  },
                  {
                    id: "in_transit",
                    label: `En Camino (${totalInTransit})`,
                  },
                  {
                    id: "delivered",
                    label: `Entregados (${totalDelivered})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setOrderStatusFilter(tab.id as typeof orderStatusFilter)
                    }
                    className={`px-3.5 py-2 rounded-full font-semibold transition-all ${
                      orderStatusFilter === tab.id ||
                      (tab.id === "priority_all" &&
                        orderStatusFilter === "active_pending")
                        ? "bg-stone-900 text-white shadow-soft"
                        : "bg-cream-50 text-stone-600 hover:bg-cream-100 border border-cream-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Order Cards Grid */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-cream-200 rounded-3xl p-12 text-center space-y-2.5 shadow-soft">
                <p className="font-serif text-xl font-semibold text-stone-900">
                  No hay órdenes en esta vista
                </p>
                <p className="text-xs text-stone-500">
                  Prueba cambiando el filtro a <strong>Todas</strong> o
                  limpiando el buscador.
                </p>
                {orderStatusFilter !== "priority_all" && (
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter("priority_all")}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-semibold"
                  >
                    <span>Ver todas las órdenes ({orders.length})</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((order, orderIdx) => {
                  const item = order.packages?.[0]?.items?.[0];
                  const isBusy = updatingOrderId === order.id;
                  const isPendingOrder =
                    order.status !== "delivered" &&
                    order.status !== "completed" &&
                    order.status !== "cancelled";
                  const needsAdvanceVerification =
                    order.payment_status === "partial_pending" &&
                    order.status !== "cancelled";

                  const stepBadge =
                    order.status === "pending"
                      ? {
                          label: "Pendiente",
                          cls: "bg-amber-100 text-amber-900 border-amber-300",
                          progress: 0,
                        }
                      : order.status === "manufacturing"
                        ? {
                            label: "En Fabricación",
                            cls: "bg-amber-50 text-amber-800 border-amber-200",
                            progress: 1,
                          }
                        : order.status === "in_transit"
                          ? {
                              label: "En Camino",
                              cls: "bg-sky-50 text-sky-800 border-sky-200",
                              progress: 2,
                            }
                          : order.status === "cancelled"
                            ? {
                                label: "Cancelada",
                                cls: "bg-rose-50 text-rose-700 border-rose-200",
                                progress: 0,
                              }
                            : {
                                label:
                                  order.remaining_amount > 0 &&
                                  order.payment_status !== "paid_full"
                                    ? "Entregado (Cobrar Saldo)"
                                    : "Entregado",
                                cls: "bg-sage-100 text-sage-800 border-sage-200",
                                progress: 3,
                              };

                  return (
                    <div
                      key={`order-${order.id}-${orderIdx}`}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`group cursor-pointer bg-white rounded-3xl p-5 shadow-soft hover:shadow-card transition-all border flex flex-col justify-between gap-4 relative overflow-hidden ${
                        needsAdvanceVerification
                          ? "border-terracotta-400 ring-1 ring-terracotta-400/30"
                          : isPendingOrder
                            ? "border-stone-300 hover:border-terracotta-500"
                            : "border-cream-200 hover:border-stone-300"
                      }`}
                    >
                      {/* Top Strip: Priority Indicator + Order Code + Time + Step Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-cream-200 bg-cream-100 flex-shrink-0">
                            <img
                              src={
                                item?.generated_art_url ||
                                "/samples/cat-suit.jpg"
                              }
                              alt={order.order_code}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-bold text-stone-900">
                                {order.order_code}
                              </span>
                              {item?.customizations?.dedication_note && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-semibold">
                                  <Gift className="w-3 h-3 text-[#c6a26c]" />
                                  <span>Regalo</span>
                                </span>
                              )}
                              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(order.created_at)}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-stone-800 truncate">
                              {order.shipping?.name || "Cliente Apolena"}
                            </p>
                            <p className="text-[11px] text-stone-500 truncate flex items-center gap-1 flex-wrap">
                              <MapPin className="w-3 h-3 text-terracotta-500 flex-shrink-0" />
                              <span>
                                {order.shipping?.district},{" "}
                                {order.shipping?.department} ·{" "}
                                {order.shipping?.phone}
                              </span>
                              {parseDeliveryPinFromOrder(
                                order.shipping?.reference,
                                item?.customizations?.delivery_location,
                                order.shipping,
                              ).pin && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#174B3D]/10 text-[#174B3D] text-[10px] font-bold">
                                  Pin GPS
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border flex-shrink-0 ${stepBadge.cls}`}
                        >
                          {stepBadge.label}
                        </span>
                      </div>

                      {/* Middle Compact Key Data: Tracking + Product Size/Frame + Payment Pill */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-cream-50 border border-cream-200 text-xs">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                            Tracking ID
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copyTracking(order.tracking_id, e)}
                            className="font-mono font-bold text-stone-800 hover:text-terracotta-600 inline-flex items-center gap-1 truncate"
                            title="Copiar Tracking ID"
                          >
                            <span className="truncate">
                              {order.tracking_id}
                            </span>
                            {copiedTrackingId === order.tracking_id ? (
                              <Check className="w-3 h-3 text-sage-600 flex-shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 text-stone-400 flex-shrink-0" />
                            )}
                          </button>
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                            Cuadro / Medida
                          </span>
                          <p className="font-semibold text-stone-800 truncate">
                            {item?.customizations?.size_label || "Cuadro IA"}
                          </p>
                        </div>

                        <div className="col-span-2 sm:col-span-1 space-y-0.5">
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                            Total & Estado Pago
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900">
                              S/ {order.total_amount.toFixed(2)}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                order.payment_status === "paid_full"
                                  ? "bg-sage-100 text-sage-800"
                                  : order.payment_status === "partial_paid"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {order.payment_status === "paid_full"
                                ? "100% Pagado"
                                : order.payment_status === "partial_paid"
                                  ? "50% Verificado"
                                  : order.remaining_amount > 0
                                    ? "50% Por Verificar"
                                    : "Pago Por Verificar"}
                            </span>
                          </div>
                        </div>

                        {/* Fila de Courier / Despacho si ya está asignado */}
                        {order.packages?.[0]?.courier && (
                          <div className="col-span-2 sm:col-span-3 pt-1.5 mt-0.5 border-t border-cream-200/70 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                            <div className="flex items-center gap-1.5 text-stone-700 min-w-0">
                              <Truck className="w-3.5 h-3.5 text-[#174B3D] shrink-0" />
                              <span className="font-semibold text-[#174B3D] truncate">
                                {order.packages[0].courier}
                              </span>
                              {order.packages[0].tracking_number && (
                                <span className="text-stone-500 font-mono text-[10px] truncate">
                                  (Guía: {order.packages[0].tracking_number})
                                </span>
                              )}
                            </div>
                            {order.packages[0].carrier_phone && (
                              <span className="text-stone-500 text-[10px] shrink-0">
                                Tel: {order.packages[0].carrier_phone}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Dedicatoria para regalo (preview + copiar rápido para el taller) */}
                      {item?.customizations?.dedication_note && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="px-3.5 py-2.5 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8] text-xs flex items-center justify-between gap-2.5 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Gift className="w-3.5 h-3.5 text-[#c6a26c] shrink-0" />
                            <p className="truncate text-stone-700 italic font-serif text-[11px]">
                              &ldquo;{item.customizations.dedication_note}&rdquo;
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) =>
                              copyDedication(
                                item.customizations!.dedication_note!,
                                `card-${order.id}`,
                                e
                              )
                            }
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-[10px] font-semibold text-stone-700 shadow-2xs transition-all active:scale-95 cursor-pointer"
                            title="Copiar dedicatoria al portapapeles"
                          >
                            {copiedDedicationId === `card-${order.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-stone-500" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Mini Visual Step Progress Bar + Quick Next Action + "Ver Detalle" Modal Trigger */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        {/* Quick Next Action for Fast Management */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {order.payment_status === "partial_pending" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={(e) =>
                                handleOrderLifecycleAction(
                                  order.id,
                                  "verify_advance_50",
                                  e,
                                )
                              }
                              className="px-3 py-1.5 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-soft transition-all"
                            >
                              <Check className="w-3 h-3" />
                              <span>
                                {order.remaining_amount > 0
                                  ? "Verificar 50%"
                                  : "Verificar Pago 100%"}
                              </span>
                            </button>
                          )}

                          {order.status === "pending" &&
                            order.payment_status === "paid_full" && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSupplierModalOrder(order);
                                }}
                                className="px-3 py-1.5 rounded-full bg-[#174B3D] hover:bg-[#123B30] text-white text-[11px] font-bold flex items-center gap-1 shadow-soft transition-all cursor-pointer"
                              >
                                <Mail className="w-3 h-3 text-[#c6a26c]" />
                                <span>Enviar a Proveedor</span>
                              </button>
                            )}

                          {order.status === "manufacturing" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTrackingOrder(order);
                              }}
                              className="px-3 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Truck className="w-3 h-3 text-terracotta-400" />
                              <span>Despachar (En Camino)</span>
                            </button>
                          )}

                          {order.status === "in_transit" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={(e) =>
                                handleOrderLifecycleAction(
                                  order.id,
                                  "set_step_delivered",
                                  e,
                                )
                              }
                              className="px-3 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold flex items-center gap-1 transition-all"
                            >
                              <PackageCheck className="w-3 h-3 text-terracotta-400" />
                              <span>Marcar Entregado</span>
                            </button>
                          )}

                          {order.status === "delivered" &&
                            order.remaining_amount > 0 &&
                            order.payment_status !== "paid_full" && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={(e) =>
                                  handleOrderLifecycleAction(
                                    order.id,
                                    "complete_final_50_payment",
                                    e,
                                  )
                                }
                                className="px-3 py-1.5 rounded-full bg-sage-600 hover:bg-sage-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-soft transition-all"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>
                                  {`Confirmar Saldo (S/ ${order.remaining_amount.toFixed(0)})`}
                                </span>
                              </button>
                            )}

                          {/* Botón Editar Orden */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingOrder(order);
                            }}
                            className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-soft transition-all"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Editar Orden</span>
                          </button>

                          {/* Botón Editar Tracking & Courier (habilitado desde En Fabricación en adelante) */}
                          {order.status !== "pending" &&
                            order.status !== "cancelled" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTrackingOrder(order);
                                }}
                                className="px-3 py-1.5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-[11px] font-bold flex items-center gap-1 shadow-soft transition-all cursor-pointer"
                                title="Editar Tracking ID y datos del Courier (Shalom, DiDi, inDrive, etc.)"
                              >
                                <Truck className="w-3 h-3 text-[#c6a26c]" />
                                <span>Tracking & Courier</span>
                              </button>
                            )}

                          {/* Botón Eliminar Orden (admin y super_admin) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingOrder(order);
                            }}
                            className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Eliminar orden y contenido relacionado"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Eliminar</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(order.id);
                          }}
                          className="ml-auto px-3.5 py-1.5 rounded-full bg-cream-100 group-hover:bg-stone-900 group-hover:text-white text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalle Completo</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "users" ? (
          /* ================================================================= */
          /* TAB 2: GESTIÓN DE USUARIOS Y ROLES (RBAC)                         */
          /* ================================================================= */
          <div className="space-y-6">
            {/* RBAC Policy Callout & Create User CTA */}
            <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta-600 uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Jerarquía de Roles de Apolena</span>
                </div>
                <h2 className="font-serif text-2xl font-semibold text-stone-900">
                  Directorio de Usuarios y Permisos
                </h2>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {isSuperAdmin ? (
                    <>
                      Como <strong>Super Admin</strong> tienes acceso total para
                      crear y gestionar usuarios con rol <code>user</code>,{" "}
                      <code>admin</code> y <code>super_admin</code>. La cuenta
                      principal <strong>{SUPER_ADMIN_EMAIL}</strong> tiene el
                      rol <code>super_admin</code> garantizado de forma
                      permanente.
                    </>
                  ) : (
                    <>
                      Como <strong>Administrador</strong> puedes crear y
                      gestionar cuentas con rol <strong>Usuario</strong> (
                      <code>user</code>) y <strong>Administrador</strong> (
                      <code>admin</code>). Las cuentas <code>super_admin</code>{" "}
                      están protegidas y solo pueden ser modificadas por un
                      Super Admin.
                    </>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="px-5 py-3 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold shadow-soft transition-all flex items-center gap-2 self-start lg:self-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Usuario / Admin</span>
              </button>
            </div>

            {/* Search & Role Filter */}
            <div className="bg-white border border-cream-200 rounded-3xl p-4 sm:p-5 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar usuario por nombre, correo o teléfono..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-stone-900 focus:outline-none focus:border-terracotta-500"
                />
                {userSearch && (
                  <button
                    type="button"
                    onClick={() => setUserSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: "all", label: `Todos (${users.length})` },
                  {
                    id: "super_admin",
                    label: `Super Admin (${users.filter((u) => u.role === "super_admin").length})`,
                  },
                  {
                    id: "admin",
                    label: `Admins (${users.filter((u) => u.role === "admin").length})`,
                  },
                  {
                    id: "user",
                    label: `Usuarios (${users.filter((u) => u.role === "user").length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setUserRoleFilter(tab.id as typeof userRoleFilter)
                    }
                    className={`px-3.5 py-2 rounded-full font-semibold transition-all ${
                      userRoleFilter === tab.id
                        ? "bg-stone-900 text-white"
                        : "bg-cream-50 text-stone-600 hover:bg-cream-100 border border-cream-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white border border-cream-200 rounded-3xl overflow-hidden shadow-soft">
              <div className="divide-y divide-cream-200">
                {filteredUsers.map((u, uIdx) => {
                  const uEmail = (u.email || "").toLowerCase();
                  const isImmutableMaster =
                    uEmail === SUPER_ADMIN_EMAIL.toLowerCase();
                  const isTargetSuperAdmin = u.role === "super_admin";
                  const canCurrentActorEdit =
                    !isImmutableMaster && (isSuperAdmin || !isTargetSuperAdmin);
                  const userOrdersCount = orders.filter(
                    (o) =>
                      o.buyer_id === u.id ||
                      (o.shipping?.email &&
                        o.shipping.email.toLowerCase() === uEmail),
                  ).length;

                  const initials = (u.name || u.email || "U")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase())
                    .join("");

                  return (
                    <div
                      key={`user-${u.id}-${uIdx}`}
                      className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-cream-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.name || u.email}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-full object-cover border-2 border-terracotta-500 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-stone-900 text-white font-bold text-xs flex items-center justify-center border-2 border-terracotta-500 flex-shrink-0">
                            {initials}
                          </div>
                        )}

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-stone-900 truncate">
                              {u.name}
                            </span>

                            {u.role === "super_admin" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-terracotta-500 text-white text-[10px] font-bold uppercase tracking-wider">
                                <Crown className="w-3 h-3" />
                                <span>Super Admin</span>
                              </span>
                            ) : u.role === "admin" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-900 text-white text-[10px] font-bold uppercase tracking-wider">
                                <ShieldCheck className="w-3 h-3 text-terracotta-400" />
                                <span>Admin</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cream-100 text-stone-700 border border-cream-200 text-[10px] font-semibold uppercase tracking-wider">
                                Usuario
                              </span>
                            )}

                            {isImmutableMaster && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Propietario Principal</span>
                              </span>
                            )}

                            {!u.is_active && (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">
                                Suspendido
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                            <span>{u.email}</span>
                            {u.phone && <span>· Tel: {u.phone}</span>}
                            <span>
                              · <strong>{userOrdersCount}</strong>{" "}
                              {userOrdersCount === 1 ? "orden" : "órdenes"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls for Role & Active Status */}
                      <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        {canCurrentActorEdit ? (
                          <>
                            <div className="flex items-center gap-1.5 bg-cream-50 border border-cream-200 rounded-full px-3 py-1.5">
                              <span className="text-[11px] text-stone-500 font-medium">
                                Rol:
                              </span>
                              <select
                                disabled={updatingUserId === u.id}
                                value={u.role}
                                onChange={(e) =>
                                  handleUpdateUser(u.id, {
                                    role: e.target.value as UserRole,
                                  })
                                }
                                className="bg-transparent font-semibold text-stone-900 focus:outline-none cursor-pointer"
                              >
                                <option value="user">Usuario (user)</option>
                                <option value="admin">
                                  Administrador (admin)
                                </option>
                                {isSuperAdmin && (
                                  <option value="super_admin">
                                    Super Admin (super_admin)
                                  </option>
                                )}
                              </select>
                            </div>

                            <button
                              type="button"
                              disabled={updatingUserId === u.id}
                              onClick={() =>
                                handleUpdateUser(u.id, {
                                  is_active: !u.is_active,
                                })
                              }
                              className={`px-3.5 py-1.5 rounded-full font-semibold border transition-all ${
                                u.is_active
                                  ? "bg-white text-stone-700 border-cream-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                                  : "bg-sage-600 text-white border-sage-600 hover:bg-sage-700"
                              }`}
                            >
                              {u.is_active ? "Suspender" : "Reactivar"}
                            </button>

                            {isSuperAdmin &&
                              u.id !== currentUser?.id &&
                              u.role !== "super_admin" && (
                                <button
                                  type="button"
                                  disabled={updatingUserId === u.id}
                                  onClick={() =>
                                    setConfirmModalData({
                                      open: true,
                                      title: `Eliminar usuario ${u.name || u.email}`,
                                      description: `Esta acción eliminará definitivamente la cuenta (${u.email}), todos sus retratos generados, órdenes y archivos en Storage. Después podrá volver a registrarse como una cuenta nueva.`,
                                      variant: "destructive",
                                      action: async () => {
                                        setUpdatingUserId(u.id);
                                        try {
                                          const res = await fetch(
                                            "/api/admin/users",
                                            {
                                              method: "DELETE",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                userId: u.id,
                                              }),
                                            },
                                          );
                                          const data = await res.json();
                                          if (!res.ok) {
                                            showToast(
                                              "error",
                                              data?.error ||
                                                "No se pudo eliminar el usuario.",
                                            );
                                            return;
                                          }
                                          showToast(
                                            "success",
                                            `Usuario ${u.email} eliminado (${data.deletedJobs || 0} retratos y ${data.deletedOrders || 0} órdenes limpiadas).`,
                                          );
                                          await Promise.all([
                                            loadAdminData(),
                                            loadAiHealth(),
                                          ]);
                                        } catch {
                                          showToast(
                                            "error",
                                            "Error de conexión al eliminar el usuario.",
                                          );
                                        } finally {
                                          setUpdatingUserId(null);
                                        }
                                      },
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold border bg-white text-red-700 border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all cursor-pointer"
                                  title="Eliminar usuario y todo su historial"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Eliminar</span>
                                </button>
                              )}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cream-100 text-stone-500 text-[11px] font-medium">
                            <Lock className="w-3 h-3" />
                            <span>
                              {isImmutableMaster
                                ? "Rol Super Admin Permanente"
                                : "Protegido (Requiere Super Admin)"}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal para Crear Nuevo Usuario / Admin */}
            {showCreateUserModal && (
              <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white border border-cream-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-hover space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta-600 block">
                        Gestión de Accesos
                      </span>
                      <h3 className="font-serif text-2xl font-semibold text-stone-900">
                        Crear Usuario en Apolena
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreateUserModal(false)}
                      className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-stone-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={handleCreateUser}
                    className="space-y-4 text-xs"
                  >
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-800 block">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Ej. María Fernanda Quispe"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 focus:outline-none focus:border-terracotta-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-800 block">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 focus:outline-none focus:border-terracotta-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Teléfono
                        </label>
                        <input
                          type="text"
                          value={newUserPhone}
                          onChange={(e) => setNewUserPhone(e.target.value)}
                          placeholder="999 888 777"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 focus:outline-none focus:border-terracotta-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Rol Asignado
                        </label>
                        <select
                          value={newUserRole}
                          onChange={(e) =>
                            setNewUserRole(e.target.value as UserRole)
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 font-semibold text-stone-900 focus:outline-none focus:border-terracotta-500"
                        >
                          <option value="user">Usuario (user)</option>
                          <option value="admin">Administrador (admin)</option>
                          {isSuperAdmin && (
                            <option value="super_admin">
                              Super Admin (super_admin)
                            </option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-800 block">
                        Contraseña Temporal
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 focus:outline-none focus:border-terracotta-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateUserModal(false)}
                        className="px-4 py-2.5 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingUser}
                        className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-soft flex items-center gap-1.5"
                      >
                        {isCreatingUser && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}
                        <span>Crear Cuenta</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "cuadros" ? (
          /* ================================================================= */
          /* TAB: CONFIGURACIÓN DINÁMICA DE CUADROS PERSONALIZADOS             */
          /* ================================================================= */
          <div className="space-y-6">
            {/* Header & Section Selector for Cuadros Personalizados */}
            <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-7 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta-600 uppercase tracking-wider">
                  <Frame className="w-3.5 h-3.5" />
                  <span>Servicio · /products/cuadros-personalizados</span>
                </div>
                <h2 className="font-serif text-2xl font-semibold text-stone-900">
                  Catálogo Dinámico de Cuadros Personalizados
                </h2>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Todo cambio en personajes IA, marcos, medidas 300 DPI y
                  acabados se guarda en Supabase PostgreSQL y se refleja en
                  tiempo real en el Estudio IA de Cuadros Personalizados.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCuadrosSection("characters")}
                  className={`px-4 py-2.5 rounded-full font-semibold flex items-center gap-1.5 transition-all ${
                    cuadrosSection === "characters"
                      ? "bg-stone-900 text-white shadow-soft"
                      : "bg-cream-50 text-stone-700 hover:bg-cream-100 border border-cream-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-terracotta-400" />
                  <span>
                    Personajes IA ({wallArtConfig.characters?.length || 0})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCuadrosSection("frames")}
                  className={`px-4 py-2.5 rounded-full font-semibold flex items-center gap-1.5 transition-all ${
                    cuadrosSection === "frames"
                      ? "bg-stone-900 text-white shadow-soft"
                      : "bg-cream-50 text-stone-700 hover:bg-cream-100 border border-cream-200"
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-terracotta-400" />
                  <span>Marcos ({wallArtConfig.frames?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCuadrosSection("sizes")}
                  className={`px-4 py-2.5 rounded-full font-semibold flex items-center gap-1.5 transition-all ${
                    cuadrosSection === "sizes"
                      ? "bg-stone-900 text-white shadow-soft"
                      : "bg-cream-50 text-stone-700 hover:bg-cream-100 border border-cream-200"
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5 text-terracotta-400" />
                  <span>
                    Medidas 300 DPI ({wallArtConfig.sizes?.length || 0})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCuadrosSection("finishes")}
                  className={`px-4 py-2.5 rounded-full font-semibold flex items-center gap-1.5 transition-all ${
                    cuadrosSection === "finishes"
                      ? "bg-stone-900 text-white shadow-soft"
                      : "bg-cream-50 text-stone-700 hover:bg-cream-100 border border-cream-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-terracotta-400" />
                  <span>Acabados ({wallArtConfig.finishes?.length || 0})</span>
                </button>
              </div>
            </div>

            {/* SUB-SECTION 1: PERSONAJES Y ESCENAS IA */}
            {cuadrosSection === "characters" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-stone-900">
                      Personajes y Escenas de la Colección IA
                    </h3>
                    <p className="text-xs text-stone-500">
                      Los nuevos personajes aparecen primero (DESC). Arrastra y suelta las tarjetas para definir el orden prioritario en Home y Estudio IA.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSavingCuadros}
                    onClick={openCreateCharacterModal}
                    className="px-4 py-2.5 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold shadow-soft flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Personaje / Escena</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(wallArtConfig.characters || []).map((char, charIdx) => {
                    const isActive = char.isAvailable !== false;
                    const isDragging = draggedCharIndex === charIdx;
                    const isDragOver =
                      dragOverCharIndex === charIdx &&
                      draggedCharIndex !== null &&
                      draggedCharIndex !== charIdx;
                    return (
                      <div
                        key={`char-${char.id}-${charIdx}`}
                        draggable={!isSavingCuadros}
                        onDragStart={(e) => {
                          setDraggedCharIndex(charIdx);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", String(charIdx));
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dragOverCharIndex !== charIdx) {
                            setDragOverCharIndex(charIdx);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverCharIndex === charIdx) {
                            setDragOverCharIndex(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          void handleDropCharacter(charIdx);
                        }}
                        onDragEnd={() => {
                          setDraggedCharIndex(null);
                          setDragOverCharIndex(null);
                        }}
                        className={`bg-white border rounded-3xl p-5 shadow-soft flex flex-col justify-between gap-4 transition-all cursor-grab active:cursor-grabbing ${
                          isDragOver
                            ? "border-[#174B3D] ring-2 ring-[#174B3D]/25 scale-[1.01] bg-emerald-50/30"
                            : isDragging
                              ? "opacity-45 border-dashed border-stone-400"
                              : isActive
                                ? "border-cream-200 hover:border-cream-300"
                                : "border-stone-200 opacity-65"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-1.5 pt-1 text-stone-400 select-none shrink-0" title="Arrastra para reordenar">
                            <GripVertical className="w-4 h-4 text-stone-400" />
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-cream-100 text-stone-600 border border-cream-200">
                              #{charIdx + 1}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewCharacterImage({
                                url: char.characterImageUrl,
                                title: char.name || "Personaje IA",
                                subtitle: char.characterTitle || char.universe,
                              })
                            }
                            title={`Ver imagen completa de ${char.name}`}
                            className="group/thumb relative w-20 h-20 rounded-2xl overflow-hidden border border-cream-200 bg-cream-100 flex-shrink-0 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                          >
                            <img
                              src={char.characterImageUrl}
                              alt={char.name}
                              className="w-full h-full object-cover object-top group-hover/thumb:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-colors flex items-center justify-center">
                              <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow" />
                            </div>
                          </button>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600">
                                {char.characterTitle}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isActive
                                    ? "bg-sage-100 text-sage-800"
                                    : "bg-stone-200 text-stone-600"
                                }`}
                              >
                                {isActive ? "Activo en Estudio" : "Oculto"}
                              </span>
                            </div>

                            <h4 className="font-serif text-lg font-bold text-stone-900 truncate">
                              {char.name}
                            </h4>
                            <p className="text-[11px] font-medium text-stone-500">
                              {char.universe}
                            </p>
                            <p className="text-xs text-stone-600 line-clamp-2">
                              {char.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isSavingCuadros}
                              onClick={() => openEditCharacterModal(char)}
                              className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold flex items-center gap-1.5"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSavingCuadros}
                              onClick={() =>
                                handleToggleCharacterAvailability(char.id)
                              }
                              className="px-3.5 py-1.5 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 font-semibold"
                            >
                              {isActive ? "Ocultar" : "Activar"}
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={isSavingCuadros}
                            onClick={() =>
                              handleDeleteCharacter(char.id, char.name)
                            }
                            className="px-3 py-1.5 rounded-full text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-SECTION 2: MARCOS DE GALERÍA */}
            {cuadrosSection === "frames" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-stone-900">
                      Marcos de Cuadros y Bastidores
                    </h3>
                    <p className="text-xs text-stone-500">
                      Gestiona los marcos disponibles, su color de
                      previsualización en vivo y su precio adicional en Soles
                      (S/).
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSavingCuadros}
                    onClick={openCreateFrameModal}
                    className="px-4 py-2.5 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold shadow-soft flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Marco</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(wallArtConfig.frames || []).map((frame, frameIdx) => {
                    const isActive = frame.isAvailable !== false;
                    const frameImgs = getNormalizedFrameImages(frame);
                    const primaryImg = frameImgs[0] || null;
                    return (
                      <div
                        key={`frame-${frame.id}-${frameIdx}`}
                        className={`bg-white border rounded-3xl p-5 shadow-soft flex flex-col justify-between gap-4 ${
                          isActive
                            ? "border-cream-200"
                            : "border-stone-200 opacity-65"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {primaryImg ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewCharacterImage({
                                    url: primaryImg,
                                    title: frame.name,
                                    subtitle: frame.description,
                                  })
                                }
                                title="Ver imagen completa del marco"
                                className="group/fthumb relative w-14 h-14 rounded-2xl border-2 border-stone-200 flex-shrink-0 overflow-hidden bg-cream-50 shadow-inner cursor-zoom-in"
                              >
                                <img
                                  src={primaryImg}
                                  alt={frame.name}
                                  className="w-full h-full object-cover group-hover/fthumb:scale-105 transition-transform"
                                />
                                <span
                                  className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                                  style={{ backgroundColor: frame.colorHex }}
                                  title={`Color Hex: ${frame.colorHex}`}
                                />
                                <span className="absolute inset-0 bg-stone-950/0 group-hover/fthumb:bg-stone-950/35 transition-colors flex items-center justify-center">
                                  <Maximize2 className="w-3.5 h-3.5 text-white opacity-0 group-hover/fthumb:opacity-100 transition-opacity" />
                                </span>
                              </button>
                            ) : (
                              <div
                                className="w-14 h-14 rounded-2xl border-2 border-stone-200 flex-shrink-0 shadow-inner"
                                style={{ backgroundColor: frame.colorHex }}
                                title={`Color Hex: ${frame.colorHex}`}
                              />
                            )}
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-stone-900 truncate">
                                  {frame.name}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    isActive
                                      ? "bg-sage-100 text-sage-800"
                                      : "bg-stone-200 text-stone-600"
                                  }`}
                                >
                                  {isActive ? "Activo" : "Oculto"}
                                </span>
                              </div>
                              <p className="text-xs text-stone-500">
                                {frame.description}
                              </p>
                              <p className="text-[11px] font-mono text-stone-400">
                                ID: {frame.id} · Color: {frame.colorHex}
                              </p>
                            </div>
                          </div>

                          <span className="px-3 py-1 rounded-full bg-terracotta-50 text-terracotta-700 border border-terracotta-200 text-xs font-bold whitespace-nowrap">
                            {frame.priceModifierPen === 0
                              ? "Incluido (S/ 0)"
                              : `+ S/ ${frame.priceModifierPen}`}
                          </span>
                        </div>

                        {/* Galería de Imágenes del Marco (Subir, Modificar, Ver y Eliminar) */}
                        <div className="bg-cream-50/70 border border-cream-200/80 rounded-2xl p-3 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-stone-700 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-terracotta-600" />
                              <span>
                                Imágenes del marco ({frameImgs.length})
                              </span>
                            </span>
                            <label className="px-2.5 py-1 rounded-full bg-white hover:bg-cream-100 border border-cream-200 text-[11px] font-semibold text-stone-800 cursor-pointer flex items-center gap-1 shadow-2xs transition-colors">
                              <Upload className="w-3 h-3 text-terracotta-600" />
                              <span>Subir imagen</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={isSavingCuadros}
                                onChange={(e) => {
                                  handleDirectUploadFrameImages(
                                    frame,
                                    e.target.files,
                                  );
                                  e.target.value = "";
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {frameImgs.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {frameImgs.map((imgUrl, imgIdx) => (
                                <div
                                  key={`${frame.id}-img-${imgIdx}`}
                                  className="group/cardimg relative rounded-xl border border-cream-200 bg-white p-1.5 flex flex-col gap-1.5 shadow-2xs"
                                >
                                  <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-cream-100">
                                    <img
                                      src={imgUrl}
                                      alt={`${frame.name} ${imgIdx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewCharacterImage({
                                          url: imgUrl,
                                          title: `${frame.name} (Imagen ${imgIdx + 1})`,
                                          subtitle: frame.description,
                                        })
                                      }
                                      title="Ver imagen completa"
                                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-stone-900/75 hover:bg-stone-900 text-white flex items-center justify-center shadow-xs transition-colors"
                                    >
                                      <Maximize2 className="w-3 h-3" />
                                    </button>
                                    {imgIdx === 0 && (
                                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-stone-900/75 text-white text-[9px] font-bold uppercase">
                                        Principal
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-1 text-[10px]">
                                    <label className="flex-1 py-1 px-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-stone-700 font-semibold cursor-pointer text-center truncate transition-colors">
                                      Modificar
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={isSavingCuadros}
                                        onChange={(e) => {
                                          handleDirectReplaceFrameImage(
                                            frame,
                                            imgIdx,
                                            e.target.files?.[0] || null,
                                          );
                                          e.target.value = "";
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      disabled={isSavingCuadros}
                                      onClick={() =>
                                        handleDirectRemoveFrameImage(
                                          frame,
                                          imgIdx,
                                        )
                                      }
                                      title="Eliminar imagen"
                                      className="py-1 px-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold flex items-center justify-center transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-stone-400 italic">
                              Sin imágenes cargadas. Sube una o más fotos de
                              referencia del marco o bastidor.
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-cream-100 text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isSavingCuadros}
                              onClick={() => openEditFrameModal(frame)}
                              className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold flex items-center gap-1.5"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Editar Marco</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSavingCuadros}
                              onClick={() =>
                                handleToggleFrameAvailability(frame.id)
                              }
                              className="px-3.5 py-1.5 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 font-semibold"
                            >
                              {isActive ? "Ocultar" : "Activar"}
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={isSavingCuadros}
                            onClick={() =>
                              handleDeleteFrame(frame.id, frame.name)
                            }
                            className="px-3 py-1.5 rounded-full text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-SECTION 3: MEDIDAS Y PRECIOS 300 DPI */}
            {cuadrosSection === "sizes" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-stone-900">
                      Medidas y Precios de Imprenta (300 DPI)
                    </h3>
                    <p className="text-xs text-stone-500">
                      Configura las dimensiones en centímetros, resolución en
                      píxeles y precios base de los cuadros personalizados.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSavingCuadros}
                    onClick={openCreateSizeModal}
                    className="px-4 py-2.5 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold shadow-soft flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Medida 300 DPI</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(wallArtConfig.sizes || []).map((preset, presetIdx) => {
                    const isActive = preset.isAvailable !== false;
                    return (
                      <div
                        key={`size-${preset.id}-${presetIdx}`}
                        className={`bg-white border rounded-3xl p-5 shadow-soft flex flex-col justify-between gap-4 ${
                          isActive
                            ? "border-cream-200"
                            : "border-stone-200 opacity-65"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-serif text-lg font-bold text-stone-900">
                                {preset.cmDimensions} ({preset.inchDimensions})
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isActive
                                    ? "bg-sage-100 text-sage-800"
                                    : "bg-stone-200 text-stone-600"
                                }`}
                              >
                                {isActive ? "Activo" : "Oculto"}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500">
                              {preset.recommendedUse}
                            </p>
                            <p className="text-[11px] font-mono text-stone-500">
                              {preset.baseWidthPx} × {preset.baseHeightPx} px ·{" "}
                              {preset.dpi} DPI ({preset.inchDimensions})
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="px-3.5 py-1.5 rounded-full bg-stone-900 text-white text-xs font-bold whitespace-nowrap">
                              S/ {preset.pricePen.toFixed(2)}
                            </span>
                            {preset.compareAtPricePen &&
                              preset.compareAtPricePen > preset.pricePen && (
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <span className="text-stone-400 line-through">
                                    Antes S/ {preset.compareAtPricePen.toFixed(2)}
                                  </span>
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    Ahorras S/{" "}
                                    {(
                                      preset.compareAtPricePen - preset.pricePen
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-cream-100 text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isSavingCuadros}
                              onClick={() => openEditSizeModal(preset)}
                              className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold flex items-center gap-1.5"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Editar Medida / Precio</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSavingCuadros}
                              onClick={() =>
                                handleToggleSizeAvailability(preset.id)
                              }
                              className="px-3.5 py-1.5 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 font-semibold"
                            >
                              {isActive ? "Ocultar" : "Activar"}
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={isSavingCuadros}
                            onClick={() =>
                              handleDeleteSize(
                                preset.id,
                                `${preset.tier} (${preset.cmDimensions})`,
                              )
                            }
                            className="px-3 py-1.5 rounded-full text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-SECTION 4: ACABADOS DE LIENZO */}
            {cuadrosSection === "finishes" && (
              <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-stone-900">
                      Acabados del Borde para Enmarcar
                    </h3>
                    <p className="text-xs text-stone-500">
                      Personaliza el nombre, descripción y recargo opcional en
                      Soles para los modos Lienzo Completo y Con Paspartú.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSavingCuadros}
                    onClick={() =>
                      persistWallArtConfig(
                        wallArtConfig,
                        "Acabados de lienzo guardados correctamente.",
                      )
                    }
                    className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-soft flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    {isSavingCuadros ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 text-terracotta-400" />
                    )}
                    <span>Guardar Acabados</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {(wallArtConfig.finishes || []).map((fin, finIdx) => (
                    <div
                      key={`finish-${fin.id}-${finIdx}`}
                      className="p-5 rounded-2xl bg-cream-50 border border-cream-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-stone-500">
                          ID: {fin.id}
                        </span>
                        <label className="inline-flex items-center gap-1.5 font-semibold text-stone-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fin.isAvailable !== false}
                            onChange={(e) =>
                              handleUpdateFinishField(fin.id, {
                                isAvailable: e.target.checked,
                              })
                            }
                            className="rounded border-stone-300 text-terracotta-500 focus:ring-terracotta-500"
                          />
                          <span>Disponible</span>
                        </label>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Nombre del Acabado
                        </label>
                        <input
                          type="text"
                          value={fin.name}
                          onChange={(e) =>
                            handleUpdateFinishField(fin.id, {
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-cream-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Descripción
                        </label>
                        <input
                          type="text"
                          value={fin.description}
                          onChange={(e) =>
                            handleUpdateFinishField(fin.id, {
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-cream-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Precio Adicional (S/)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={fin.priceModifierPen}
                          onChange={(e) =>
                            handleUpdateFinishField(fin.id, {
                              priceModifierPen: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-white border border-cream-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODAL: CREAR / EDITAR PERSONAJE IA */}
            {showCharacterModal && (
              <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white border border-cream-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-hover space-y-5 my-auto max-h-[92vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-cream-200">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta-600 block">
                        Colección Cuadros Personalizados · Asistente IA
                      </span>
                      <h3 className="font-serif text-2xl font-semibold text-stone-900">
                        {editingCharacterId
                          ? "Editar Personaje / Escena IA"
                          : "Nuevo Personaje / Escena IA"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCharacterModal(false)}
                      className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-stone-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={handleSaveCharacterForm}
                    className="space-y-5 text-xs"
                  >
                    {/* PASO 1 PRINCIPAL: SUBIR IMAGEN DEL PERSONAJE */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-stone-900 block text-sm">
                          1. Imagen de Referencia / Vestuario
                        </label>
                        <span className="text-[11px] text-terracotta-600 font-medium">
                          Paso obligatorio
                        </span>
                      </div>

                      {!charForm.characterImageUrl ? (
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files?.[0]) {
                              const file = e.dataTransfer.files[0];
                              handleImageFileToDataUrl(file, (dataUrl) => {
                                setCharForm((prev) => ({
                                  ...prev,
                                  characterImageUrl: dataUrl,
                                  fusionSampleUrl: dataUrl,
                                }));
                                handleAnalyzeCharacterImage(dataUrl, file.name);
                              });
                            }
                          }}
                          className="border-2 border-dashed border-terracotta-300 hover:border-terracotta-500 rounded-2xl p-6 sm:p-8 bg-amber-50/30 text-center transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full bg-terracotta-100 text-terracotta-600 flex items-center justify-center">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-stone-800 text-sm">
                              Arrastra la imagen del personaje aquí o haz clic
                              para seleccionarla
                            </p>
                            <p className="text-stone-500 text-xs">
                              Formatos JPG, PNG o WEBP de alta resolución.
                            </p>
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-medium border border-amber-200">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              Modelo IA: Analiza vestuario, época y temática
                              para autocompletar todo a costo $0
                            </span>
                          </div>

                          <label className="mt-1 px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs cursor-pointer shadow-soft inline-flex items-center gap-1.5">
                            <ImagePlus className="w-3.5 h-3.5" />
                            <span>Subir Imagen de Referencia</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  handleImageFileToDataUrl(file, (dataUrl) => {
                                    setCharForm((prev) => ({
                                      ...prev,
                                      characterImageUrl: dataUrl,
                                      fusionSampleUrl: dataUrl,
                                    }));
                                    handleAnalyzeCharacterImage(
                                      dataUrl,
                                      file.name,
                                    );
                                  });
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col sm:flex-row items-center gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewCharacterImage({
                                url: charForm.characterImageUrl,
                                title:
                                  charForm.name ||
                                  "Imagen de Referencia / Vestuario",
                                subtitle:
                                  charForm.characterTitle || charForm.universe,
                              })
                            }
                            title="Haz clic para ver la imagen en su tamaño completo"
                            className="group/preview relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-cream-200 shadow-soft bg-white shrink-0 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                          >
                            <img
                              src={charForm.characterImageUrl}
                              alt="Vestuario de referencia"
                              className="w-full h-full object-cover object-top group-hover/preview:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/45 transition-colors flex flex-col items-center justify-center gap-1">
                              <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover/preview:opacity-100 transition-opacity drop-shadow" />
                              <span className="text-[9px] font-bold text-white opacity-0 group-hover/preview:opacity-100 transition-opacity">
                                Ver completa
                              </span>
                            </div>
                          </button>

                          <div className="flex-1 space-y-2.5 w-full text-left">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-semibold text-stone-900 block text-xs">
                                  Vestuario cargado exitosamente
                                </span>
                                <span className="text-[11px] text-stone-500">
                                  Listo para procesar o personalizar. Haz clic en la imagen para verla completa.
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewCharacterImage({
                                      url: charForm.characterImageUrl,
                                      title:
                                        charForm.name ||
                                        "Imagen de Referencia / Vestuario",
                                      subtitle:
                                        charForm.characterTitle ||
                                        charForm.universe,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-full bg-white hover:bg-cream-100 text-stone-800 font-semibold text-[11px] flex items-center gap-1.5 border border-cream-200 shadow-2xs transition-colors"
                                >
                                  <Maximize2 className="w-3.5 h-3.5 text-terracotta-600" />
                                  <span>Ver completa</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={isAnalyzingCharacter}
                                  onClick={() =>
                                    handleAnalyzeCharacterImage(
                                      charForm.characterImageUrl,
                                      charForm.name || "personaje.jpg",
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-[11px] flex items-center gap-1.5 border border-amber-200"
                                >
                                  {isAnalyzingCharacter ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                  )}
                                  <span>Re-analizar con IA ($0)</span>
                                </button>

                                <label className="px-3 py-1.5 rounded-full bg-white hover:bg-cream-100 text-stone-700 font-semibold text-[11px] flex items-center gap-1.5 border border-cream-200 cursor-pointer">
                                  <ImagePlus className="w-3.5 h-3.5" />
                                  <span>Cambiar</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        const file = e.target.files[0];
                                        handleImageFileToDataUrl(
                                          file,
                                          (dataUrl) => {
                                            setCharForm((prev) => ({
                                              ...prev,
                                              characterImageUrl: dataUrl,
                                              fusionSampleUrl: dataUrl,
                                            }));
                                            handleAnalyzeCharacterImage(
                                              dataUrl,
                                              file.name,
                                            );
                                          },
                                        );
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>

                            {/* Estado del análisis IA */}
                            {isAnalyzingCharacter && (
                              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                                <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                                <span>
                                  Analizando fisonomía y temática del vestuario
                                  con IA (Costo $0)...
                                </span>
                              </div>
                            )}

                            {analysisSuccessMsg && !isAnalyzingCharacter && (
                              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sage-50 border border-sage-200 text-sage-800 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
                                <span>{analysisSuccessMsg}</span>
                              </div>
                            )}

                            {analysisErrorMsg && !isAnalyzingCharacter && (
                              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>{analysisErrorMsg}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PASO 2: CAMPOS ESENCIALES DEL PERSONAJE */}
                    <div className="pt-2 border-t border-cream-200 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-stone-900 block text-sm">
                          2. Datos del Personaje
                        </label>
                        <label className="inline-flex items-center gap-2 font-medium text-stone-700 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={charForm.isAvailable !== false}
                            onChange={(e) =>
                              setCharForm({
                                ...charForm,
                                isAvailable: e.target.checked,
                              })
                            }
                            className="rounded border-stone-300 text-terracotta-500"
                          />
                          <span>Activo en tienda</span>
                        </label>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Nombre del Personaje / Escena
                        </label>
                        <input
                          type="text"
                          required
                          value={charForm.name}
                          onChange={(e) =>
                            setCharForm({ ...charForm, name: e.target.value })
                          }
                          placeholder="Ej. Sapa Inca Imperial"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 focus:outline-none focus:border-terracotta-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Descripción visible para el cliente
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={charForm.description}
                          onChange={(e) =>
                            setCharForm({
                              ...charForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Describe el vestuario, iluminación y atmósfera para el cliente..."
                          className="w-full px-3.5 py-2 rounded-xl bg-cream-50 border border-cream-200 focus:outline-none focus:border-terracotta-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-200">
                      <button
                        type="button"
                        onClick={() => setShowCharacterModal(false)}
                        className="px-4 py-2.5 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCuadros}
                        className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-soft flex items-center gap-1.5"
                      >
                        {isSavingCuadros && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}
                        <span>Guardar Personaje</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* VISUALIZADOR DE IMAGEN COMPLETA DEL PERSONAJE / VESTUARIO */}
            {previewCharacterImage && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label={`Vista completa de ${previewCharacterImage.title}`}
                onClick={() => setPreviewCharacterImage(null)}
                className="fixed inset-0 z-[70] bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="relative bg-white border border-cream-200 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
                >
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-cream-200 bg-cream-50">
                    <div className="min-w-0 pr-3">
                      {previewCharacterImage.subtitle && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600 block truncate">
                          {previewCharacterImage.subtitle}
                        </span>
                      )}
                      <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900 truncate">
                        {previewCharacterImage.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={previewCharacterImage.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-full bg-white hover:bg-cream-100 border border-cream-200 text-stone-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-terracotta-600" />
                        <span className="hidden sm:inline">Abrir original</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setPreviewCharacterImage(null)}
                        aria-label="Cerrar visualizador"
                        className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-stone-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-stone-950/95 flex items-center justify-center overflow-auto">
                    <img
                      src={previewCharacterImage.url}
                      alt={previewCharacterImage.title}
                      className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: CREAR / EDITAR MARCO DE CUADRO */}
            {showFrameModal && (
              <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white border border-cream-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-hover space-y-5 my-8 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-cream-200">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta-600 block">
                        Enmarcado de Galería
                      </span>
                      <h3 className="font-serif text-2xl font-semibold text-stone-900">
                        {editingFrameId ? "Editar Marco" : "Nuevo Marco"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFrameModal(false)}
                      className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-stone-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={handleSaveFrameForm}
                    className="space-y-4 text-xs"
                  >
                    {/* Imágenes del Marco (Subir, Modificar, Ver, Eliminar) */}
                    <div className="space-y-2.5 bg-cream-50/80 border border-cream-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <label className="font-semibold text-stone-800 block">
                            Imágenes del Marco / Bastidor
                          </label>
                          <p className="text-[11px] text-stone-500">
                            Sube fotos reales de la moldura o bastidor. Puedes
                            modificarlas o eliminarlas en cualquier momento.
                          </p>
                        </div>
                        <label className="px-3 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir imagen</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              handleAddFrameModalImages(e.target.files);
                              e.target.value = "";
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {getNormalizedFrameImages(frameForm).length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                          {getNormalizedFrameImages(frameForm).map(
                            (imgUrl, imgIdx) => (
                              <div
                                key={`modal-frame-img-${imgIdx}`}
                                className="rounded-xl border border-cream-200 bg-white p-2 flex flex-col gap-2 shadow-2xs"
                              >
                                <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-cream-100">
                                  <img
                                    src={imgUrl}
                                    alt={`${frameForm.name || "Marco"} ${imgIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewCharacterImage({
                                        url: imgUrl,
                                        title: `${frameForm.name || "Marco"} (Imagen ${imgIdx + 1})`,
                                        subtitle: frameForm.description,
                                      })
                                    }
                                    title="Ver imagen completa"
                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-stone-900/75 hover:bg-stone-900 text-white flex items-center justify-center shadow-xs"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                  </button>
                                  {imgIdx === 0 && (
                                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-stone-900/75 text-white text-[9px] font-bold uppercase">
                                      Principal
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-1 text-[11px]">
                                  <label className="flex-1 py-1 px-2 rounded-lg bg-cream-100 hover:bg-cream-200 text-stone-800 font-semibold cursor-pointer text-center transition-colors">
                                    Modificar
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        handleReplaceFrameModalImage(
                                          imgIdx,
                                          e.target.files?.[0] || null,
                                        );
                                        e.target.value = "";
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveFrameModalImage(imgIdx)
                                    }
                                    title="Eliminar imagen"
                                    className="py-1 px-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold flex items-center justify-center transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-1.5 py-5 px-4 border-2 border-dashed border-cream-300 hover:border-terracotta-400 rounded-2xl bg-white/70 cursor-pointer transition-colors text-center">
                          <ImageIcon className="w-6 h-6 text-stone-400" />
                          <span className="text-xs font-semibold text-stone-700">
                            Haz clic aquí para subir una o más fotos del marco
                          </span>
                          <span className="text-[11px] text-stone-400">
                            JPG, PNG o WEBP (se optimizan automáticamente en la
                            nube)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              handleAddFrameModalImages(e.target.files);
                              e.target.value = "";
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-800 block">
                        Nombre del Marco
                      </label>
                      <input
                        type="text"
                        required
                        value={frameForm.name}
                        onChange={(e) =>
                          setFrameForm({ ...frameForm, name: e.target.value })
                        }
                        placeholder="Ej. Marco de Madera Nogal Clásico"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 focus:outline-none focus:border-terracotta-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-800 block">
                        Descripción del Material / Acabado
                      </label>
                      <input
                        type="text"
                        required
                        value={frameForm.description}
                        onChange={(e) =>
                          setFrameForm({
                            ...frameForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Ej. Madera sólida con acabado satinado"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 focus:outline-none focus:border-terracotta-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Precio Adicional (S/)
                        </label>
                        <input
                          type="number"
                          min={0}
                          required
                          value={frameForm.priceModifierPen}
                          onChange={(e) =>
                            setFrameForm({
                              ...frameForm,
                              priceModifierPen: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 focus:outline-none focus:border-terracotta-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Color del Marco (Visor)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={frameForm.colorHex}
                            onChange={(e) =>
                              setFrameForm({
                                ...frameForm,
                                colorHex: e.target.value,
                              })
                            }
                            className="w-10 h-10 rounded-xl border border-cream-200 cursor-pointer bg-white p-0.5"
                          />
                          <input
                            type="text"
                            value={frameForm.colorHex}
                            onChange={(e) =>
                              setFrameForm({
                                ...frameForm,
                                colorHex: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-2.5 rounded-xl bg-cream-50 border border-cream-200 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 font-semibold text-stone-800 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={frameForm.isAvailable !== false}
                        onChange={(e) =>
                          setFrameForm({
                            ...frameForm,
                            isAvailable: e.target.checked,
                          })
                        }
                        className="rounded border-stone-300 text-terracotta-500"
                      />
                      <span>Disponible para selección en tienda</span>
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-200">
                      <button
                        type="button"
                        onClick={() => setShowFrameModal(false)}
                        className="px-4 py-2.5 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCuadros}
                        className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-soft flex items-center gap-1.5"
                      >
                        {isSavingCuadros && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}
                        <span>Guardar Marco</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL: CREAR / EDITAR MEDIDA Y PRECIO 300 DPI */}
            {showSizeModal && (
              <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white border border-cream-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-hover space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-cream-200">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta-600 block">
                        Formatos de Imprenta 300 DPI
                      </span>
                      <h3 className="font-serif text-2xl font-semibold text-stone-900">
                        {editingSizeId
                          ? "Editar Medida y Precio"
                          : "Nueva Medida de Cuadro"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSizeModal(false)}
                      className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-stone-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={handleSaveSizeForm}
                    className="space-y-4 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Nombre del Tamaño (Tier)
                        </label>
                        <input
                          type="text"
                          required
                          value={sizeForm.tier}
                          onChange={(e) =>
                            setSizeForm({ ...sizeForm, tier: e.target.value })
                          }
                          placeholder="Ej. Grande (L)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Precio de Venta / Base (S/)
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={sizeForm.pricePen}
                          onChange={(e) =>
                            setSizeForm({
                              ...sizeForm,
                              pricePen: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 font-bold text-stone-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Precio Antes / Comparativo (S/)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={sizeForm.compareAtPricePen || ""}
                          onChange={(e) =>
                            setSizeForm({
                              ...sizeForm,
                              compareAtPricePen: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="Ej. 190.00"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Dimensiones en cm
                        </label>
                        <input
                          type="text"
                          required
                          value={sizeForm.cmDimensions}
                          onChange={(e) =>
                            setSizeForm({
                              ...sizeForm,
                              cmDimensions: e.target.value,
                              label: e.target.value,
                            })
                          }
                          placeholder="Ej. 40 × 50 cm"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Equivalente en Pulgadas
                        </label>
                        <input
                          type="text"
                          required
                          value={sizeForm.inchDimensions}
                          onChange={(e) =>
                            setSizeForm({
                              ...sizeForm,
                              inchDimensions: e.target.value,
                            })
                          }
                          placeholder='Ej. 16 × 20"'
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Ancho en Píxeles (300 DPI)
                        </label>
                        <input
                          type="number"
                          required
                          value={sizeForm.baseWidthPx}
                          onChange={(e) =>
                            setSizeForm({
                              ...sizeForm,
                              baseWidthPx: Number(e.target.value) || 3543,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-800 block">
                          Alto en Píxeles (300 DPI)
                        </label>
                        <input
                          type="number"
                          required
                          value={sizeForm.baseHeightPx}
                          onChange={(e) =>
                            setSizeForm({
                              ...sizeForm,
                              baseHeightPx: Number(e.target.value) || 4724,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-stone-800 block">
                        Uso recomendado en el hogar
                      </label>
                      <input
                        type="text"
                        required
                        value={sizeForm.recommendedUse}
                        onChange={(e) =>
                          setSizeForm({
                            ...sizeForm,
                            recommendedUse: e.target.value,
                          })
                        }
                        placeholder="Ej. Salas, dormitorios y comedores"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200"
                      />
                    </div>

                    <label className="inline-flex items-center gap-2 font-semibold text-stone-800 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={sizeForm.isAvailable !== false}
                        onChange={(e) =>
                          setSizeForm({
                            ...sizeForm,
                            isAvailable: e.target.checked,
                          })
                        }
                        className="rounded border-stone-300 text-terracotta-500"
                      />
                      <span>Medida disponible en tienda</span>
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-200">
                      <button
                        type="button"
                        onClick={() => setShowSizeModal(false)}
                        className="px-4 py-2.5 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCuadros}
                        className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-soft flex items-center gap-1.5"
                      >
                        {isSavingCuadros && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}
                        <span>Guardar Medida</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "settings" ? (
          /* ================================================================= */
          /* TAB 3: CONFIGURACIÓN DE APOLENA, MOTORES IA Y CATÁLOGO            */
          /* ================================================================= */
          <div className="space-y-6">
            {/* Monitor de Consumo y Estado por Modelo IA */}
            <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-terracotta-600 text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Monitoreo de Motores IA</span>
                  </div>
                  <h2 className="font-serif text-2xl font-semibold text-stone-900 mt-0.5">
                    Consumo y Estado por Modelo
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Contabiliza imágenes generadas registradas en base de datos (<code>generation_jobs</code>, 1 propuesta por modelo). El saldo real en USD/PEN se consulta en el panel de facturación de cada proveedor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadAiHealth}
                  className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-cream-100 hover:bg-cream-200 border border-cream-300 text-stone-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualizar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    key: "openai",
                    label: "OpenAI (gpt-image-1 / gpt-4o-mini)",
                    billingUrl:
                      "https://platform.openai.com/settings/organization/billing/overview",
                  },
                  {
                    key: "gemini",
                    label: "Google Gemini (Flash Vision / Imagen)",
                    billingUrl: "https://aistudio.google.com/apikey",
                  },
                ].map((item) => {
                  const stats = aiHealthData?.providerStats?.[item.key] || {
                    total: 0,
                    thisMonth: 0,
                    lastUsedAt: null,
                  };
                  const hasKey = Boolean(
                    aiHealthData?.envStatus?.[
                      item.key as "openai" | "gemini"
                    ],
                  );
                  const hasActiveAlert = Boolean(
                    aiHealthData?.health?.activeAlert &&
                      aiHealthData.health.lastProvider
                        .toLowerCase()
                        .includes(item.key),
                  );

                  return (
                    <div
                      key={item.key}
                      className={`p-4 rounded-2xl border space-y-3 ${
                        hasActiveAlert
                          ? "bg-red-50/70 border-red-300"
                          : "bg-cream-50 border-cream-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-sm text-stone-900">
                          {item.label}
                        </strong>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            hasActiveAlert
                              ? "bg-red-600 text-white"
                              : hasKey
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-200 text-stone-600"
                          }`}
                        >
                          {hasActiveAlert
                            ? "Alerta de créditos"
                            : hasKey
                              ? "Clave activa"
                              : "Sin configurar"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-white border border-cream-200">
                          <span className="text-[10px] text-stone-500 block">
                            Imágenes este mes (BD)
                          </span>
                          <span className="font-mono text-lg font-bold text-[#174B3D]">
                            {stats.thisMonth}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-cream-200">
                          <span className="text-[10px] text-stone-500 block">
                            Total histórico (BD)
                          </span>
                          <span className="font-mono text-lg font-bold text-stone-900">
                            {stats.total}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                        <span>
                          {stats.lastUsedAt
                            ? `Último uso: ${new Date(stats.lastUsedAt).toLocaleDateString("es-PE")}`
                            : "Sin registros aún"}
                        </span>
                        <a
                          href={item.billingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-[#174B3D] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Ver saldo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Analítica de Calidad IA (Juez Automático + Win-Rate de Clientes + Feedback) */}
              {aiHealthData?.qualityAnalytics && (() => {
                const qa = aiHealthData.qualityAnalytics;
                const totalSelected =
                  qa.winRate.openai.selectedCount +
                  qa.winRate.gemini.selectedCount;
                const openaiPct =
                  totalSelected > 0
                    ? Math.round(
                        (qa.winRate.openai.selectedCount / totalSelected) * 100,
                      )
                    : 0;
                const geminiPct =
                  totalSelected > 0 ? 100 - openaiPct : 0;
                const feedbackLabels: Record<string, string> = {
                  no_match_pet: "No se parece a mascota",
                  bad_proportions: "Proporciones cabeza/cuerpo",
                  too_dark: "Muy oscuro / fondo",
                  cropped_ears: "Orejas/cabeza recortadas",
                };
                const totalFeedback = Object.values(qa.feedbackSummary).reduce(
                  (a, b) => a + b,
                  0,
                );

                return (
                  <div className="pt-4 border-t border-cream-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#174B3D]">
                          Calidad IA y Aprendizaje Continuo (Juez Automático + Elección de Clientes)
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Cada retrato se evalúa automáticamente antes de mostrarse (auto-reintento si baja de 7/10) y el feedback real alimenta las reglas de cada personaje.
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-cream-100 text-stone-700 border border-cream-200 shrink-0 self-start">
                        {totalSelected} elecciones registradas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {[
                        {
                          key: "openai" as const,
                          title: "Propuesta 1 · OpenAI",
                          pct: openaiPct,
                          data: qa.winRate.openai,
                        },
                        {
                          key: "gemini" as const,
                          title: "Propuesta 2 · Google Gemini",
                          pct: geminiPct,
                          data: qa.winRate.gemini,
                        },
                      ].map((row) => (
                        <div
                          key={row.key}
                          className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-stone-900">
                              {row.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#174B3D]/10 text-[#174B3D] text-[11px] font-bold">
                              Win-Rate: {row.pct}%
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 rounded-xl bg-white border border-cream-200">
                              <span className="text-[10px] text-stone-500 block">
                                Elegida / Comprada
                              </span>
                              <span className="font-mono font-bold text-stone-900">
                                {row.data.selectedCount} / {row.data.purchasedCount}
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-cream-200">
                              <span className="text-[10px] text-stone-500 block">
                                Nota Juez IA
                              </span>
                              <span className="font-mono font-bold text-[#174B3D]">
                                {row.data.avgQualityScore !== null
                                  ? `${row.data.avgQualityScore}/10`
                                  : "—"}
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-cream-200">
                              <span className="text-[10px] text-stone-500 block">
                                Autocorregidas
                              </span>
                              <span className="font-mono font-bold text-amber-700">
                                {row.data.autoRetriedCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalFeedback > 0 && (
                      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-bold text-amber-950">
                          Feedback de clientes ({totalFeedback}):
                        </span>
                        {Object.entries(qa.feedbackSummary)
                          .filter(([, count]) => count > 0)
                          .map(([reason, count]) => (
                            <span
                              key={reason}
                              className="px-2.5 py-0.5 rounded-full bg-white border border-amber-200 text-amber-900 font-semibold"
                            >
                              {feedbackLabels[reason] || reason}: {count}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-4">
              <div className="flex items-center gap-2 text-terracotta-600 text-xs font-semibold uppercase tracking-wider">
                <Frame className="w-4 h-4" />
                <span>Arquitectura Extensible de Productos</span>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-stone-900">
                Catálogo y Personalizaciones
              </h2>
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-stone-900">
                      {prod.title}
                    </strong>
                    <span className="px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-800 font-medium">
                      {prod.status}
                    </span>
                  </div>
                  <p className="text-stone-600">{prod.description}</p>
                  <div className="space-y-2 pt-2 border-t border-cream-200">
                    <p className="font-semibold text-stone-800">
                      Personajes IA (
                      {prod.customization_config?.characters?.length || 0}) ·
                      Marcos ({prod.customization_config?.frames?.length || 0})
                      · Medidas ({prod.customization_config?.sizes?.length || 0}
                      )
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("cuadros")}
                      className="px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs inline-flex items-center gap-1.5"
                    >
                      <Pencil className="w-3 h-3 text-terracotta-400" />
                      <span>
                        Gestionar Personajes, Marcos y Medidas de Cuadros
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {settings && (
              <form
                onSubmit={handleSaveSettings}
                className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-4 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta-600 block">
                      Parámetros Operativos
                    </span>
                    <h2 className="font-serif text-2xl font-semibold text-stone-900">
                      Cuentas Yape / Plin / Banco y Tarifas
                    </h2>
                  </div>
                  {!isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                      <Lock className="w-3 h-3" />
                      <span>Solo lectura (Super Admin edita)</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Número Yape
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={settings.PAYMENT_METHODS_CONFIG.yape.phone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          PAYMENT_METHODS_CONFIG: {
                            ...settings.PAYMENT_METHODS_CONFIG,
                            yape: {
                              ...settings.PAYMENT_METHODS_CONFIG.yape,
                              phone: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Número Plin
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={settings.PAYMENT_METHODS_CONFIG.plin.phone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          PAYMENT_METHODS_CONFIG: {
                            ...settings.PAYMENT_METHODS_CONFIG,
                            plin: {
                              ...settings.PAYMENT_METHODS_CONFIG.plin,
                              phone: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Banco / Moneda
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      placeholder="Ej. BCP Soles"
                      value={
                        settings.PAYMENT_METHODS_CONFIG.bank_transfer
                          ?.bank_name || ""
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          PAYMENT_METHODS_CONFIG: {
                            ...settings.PAYMENT_METHODS_CONFIG,
                            bank_transfer: {
                              ...settings.PAYMENT_METHODS_CONFIG.bank_transfer,
                              bank_name: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Número de Cuenta Bancaria
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      placeholder="Ej. 191-98451234-0-42"
                      value={
                        settings.PAYMENT_METHODS_CONFIG.bank_transfer
                          ?.account_number || ""
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          PAYMENT_METHODS_CONFIG: {
                            ...settings.PAYMENT_METHODS_CONFIG,
                            bank_transfer: {
                              ...settings.PAYMENT_METHODS_CONFIG.bank_transfer,
                              account_number: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 font-mono disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Cuenta Interbancaria (CCI)
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      placeholder="Ej. 002-191009845123404251"
                      value={
                        settings.PAYMENT_METHODS_CONFIG.bank_transfer?.cci || ""
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          PAYMENT_METHODS_CONFIG: {
                            ...settings.PAYMENT_METHODS_CONFIG,
                            bank_transfer: {
                              ...settings.PAYMENT_METHODS_CONFIG.bank_transfer,
                              cci: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 font-mono disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Nombre Completo del Titular
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      placeholder="Ej. APOLENA STUDIO SAC"
                      value={
                        settings.PAYMENT_METHODS_CONFIG.bank_transfer
                          ?.holder_name || ""
                      }
                      onChange={(e) => {
                        const newHolder = e.target.value;
                        setSettings({
                          ...settings,
                          PAYMENT_METHODS_CONFIG: {
                            ...settings.PAYMENT_METHODS_CONFIG,
                            bank_transfer: {
                              ...settings.PAYMENT_METHODS_CONFIG.bank_transfer,
                              holder_name: newHolder,
                            },
                            yape: {
                              ...settings.PAYMENT_METHODS_CONFIG.yape,
                              holder_name: newHolder,
                            },
                            plin: {
                              ...settings.PAYMENT_METHODS_CONFIG.plin,
                              holder_name: newHolder,
                            },
                          },
                        });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 font-medium disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Delivery Lima (S/)
                    </label>
                    <input
                      type="number"
                      disabled={!isSuperAdmin}
                      value={
                        settings.SHIPPING_RATES_CONFIG.lima_metropolitana_pen
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          SHIPPING_RATES_CONFIG: {
                            ...settings.SHIPPING_RATES_CONFIG,
                            lima_metropolitana_pen: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Delivery Provincias (S/)
                    </label>
                    <input
                      type="number"
                      disabled={!isSuperAdmin}
                      value={settings.SHIPPING_RATES_CONFIG.provincias_pen}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          SHIPPING_RATES_CONFIG: {
                            ...settings.SHIPPING_RATES_CONFIG,
                            provincias_pen: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2 pt-1">
                    <label className="font-semibold text-stone-800 block">
                      Correo receptor de notificaciones y órdenes
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      placeholder="Ej. apolenaperu@gmail.com"
                      value={adminEmailsInput}
                      onChange={(e) => setAdminEmailsInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 font-medium disabled:opacity-60"
                    />
                    <p className="text-[11px] text-stone-500">
                      Recibe alertas de nuevas órdenes, consultas de contacto y
                      libro de reclamaciones. Puedes separar varios correos con
                      coma.
                    </p>
                  </div>

                  <div className="space-y-1 sm:col-span-2 pt-1">
                    <label className="font-semibold text-stone-800 block">
                      Correo del Proveedor / Fabricador (por defecto)
                    </label>
                    <input
                      type="email"
                      disabled={!isSuperAdmin}
                      placeholder="Ej. mariano260996@gmail.com"
                      value={supplierEmailInput}
                      onChange={(e) => setSupplierEmailInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 font-medium disabled:opacity-60"
                    />
                    <p className="text-[11px] text-stone-500">
                      Se pre-llenará automáticamente al enviar una orden de
                      fabricación al taller una vez confirmado el pago 100%.
                    </p>
                  </div>
                </div>

                {isSuperAdmin ? (
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-soft transition-all"
                  >
                    Guardar Cambios en platform_settings
                  </button>
                ) : (
                  <p className="text-[11px] text-stone-500 text-center pt-2">
                    La modificación de cuentas bancarias y tarifas globales está
                    reservada exclusivamente para el rol{" "}
                    <strong>super_admin</strong>.
                  </p>
                )}
              </form>
            )}
          </div>
          </div>
        ) : (
          /* ================================================================= */
          /* TAB 4: COLA DE CORREOS TRANSACCIONALES (email_queue)              */
          /* ================================================================= */
          <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cream-200">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-serif text-2xl font-semibold text-stone-900">
                    Historial de Notificaciones en <code>email_queue</code>
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      isResendConfigured
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isResendConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                      }`}
                    />
                    {isResendConfigured
                      ? "Resend API Conectado"
                      : "Modo Simulación (Sin RESEND_API_KEY)"}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Registro auditable de todos los correos transaccionales generados para el comprador y administración.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isRetryingEmails}
                  onClick={() => handleRetryPendingEmails()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#174B3D] hover:bg-[#123b30] text-white text-xs font-semibold shadow-soft transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isRetryingEmails ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {isRetryingEmails
                      ? "Procesando envíos..."
                      : "Procesar / Despachar Pendientes"}
                  </span>
                </button>
              </div>
            </div>

            {!isResendConfigured && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-xs text-amber-900 leading-relaxed shadow-2xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-950">
                    Los correos se encuentran en cola porque falta configurar la API Key de Resend
                  </p>
                  <p className="text-amber-800">
                    Actualmente el sistema está en <strong>Modo Simulación</strong> para no interrumpir el flujo del usuario. Para activar el envío real hacia las bandejas de entrada:
                  </p>
                  <ol className="list-decimal pl-4 space-y-0.5 text-amber-850 mt-1">
                    <li>
                      Crea tu cuenta gratuita en <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline">resend.com</a> y genera una API Key.
                    </li>
                    <li>
                      Configura <code>RESEND_API_KEY=&quot;re_...&quot;</code> en tu archivo <code>.env.local</code> (o en Vercel Environment Variables).
                    </li>
                    <li>
                      Configura <code>RESEND_FROM_EMAIL</code> con tu correo verificado (o <code>onboarding@resend.dev</code> en modo prueba).
                    </li>
                    <li>
                      Haz clic en <strong>&ldquo;Procesar / Despachar Pendientes&rdquo;</strong> arriba para enviar todos los correos acumulados.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {emailQueue.length === 0 ? (
              <p className="text-xs text-stone-500 py-10 text-center">
                Aún no hay correos encolados. Crea una orden para ver las
                notificaciones automáticas.
              </p>
            ) : (
              <div className="space-y-3">
                {emailQueue.map((mail) => (
                  <div
                    key={mail.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors hover:border-terracotta-200"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase border ${
                            mail.status === "sent"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : mail.status === "failed"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {mail.status === "sent"
                            ? "Enviado con éxito"
                            : mail.status === "failed"
                            ? "Fallido"
                            : "Pendiente de Envío"}
                        </span>
                        <span className="font-mono text-stone-500 bg-white px-2 py-0.5 rounded-md border border-cream-200 text-[10px]">
                          {mail.template}
                        </span>
                        {mail.attempts > 0 && (
                          <span className="text-[10px] text-stone-400">
                            (Intentos: {mail.attempts}/{mail.max_attempts})
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-stone-900 text-sm">
                        {mail.subject}
                      </p>
                      <p className="text-stone-600">
                        Para: <strong className="text-stone-800">{mail.to_email}</strong>
                        {mail.cc && mail.cc.length > 0 && ` (CC: ${mail.cc.join(", ")})`}
                      </p>
                      {mail.last_error && (
                        <p className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200 font-mono">
                          <strong>Detalle:</strong> {mail.last_error}
                        </p>
                      )}
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-stone-400">
                        {new Date(mail.created_at).toLocaleString("es-PE")}
                      </span>
                      {mail.status !== "sent" && (
                        <button
                          type="button"
                          disabled={retryingEmailId === mail.id || isRetryingEmails}
                          onClick={() => handleRetryPendingEmails(mail.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-[11px] font-semibold text-stone-700 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${
                              retryingEmailId === mail.id ? "animate-spin" : ""
                            }`}
                          />
                          <span>
                            {retryingEmailId === mail.id ? "Enviando..." : "Reintentar"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL DE EXPEDIENTE COMPLETO DE LA ORDEN                          */}
        {/* ================================================================= */}
        {selectedOrder && (
          <div
            className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedOrderId(null)}
          >
            <div
              className="bg-white border border-cream-200 rounded-3xl max-w-6xl w-full p-5 sm:p-8 lg:p-10 shadow-hover space-y-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base sm:text-lg font-serif font-bold text-stone-900">
                      Orden {selectedOrder.order_code}
                    </span>
                    <button
                      type="button"
                      onClick={(e) =>
                        copyTracking(selectedOrder.tracking_id, e)
                      }
                      className="text-xs font-mono px-3 py-1 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-800 border border-cream-200 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>Tracking: {selectedOrder.tracking_id}</span>
                      {copiedTrackingId === selectedOrder.tracking_id ? (
                        <Check className="w-3.5 h-3.5 text-sage-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                      )}
                    </button>
                    <Link
                      href={`/track/${selectedOrder.tracking_id}`}
                      target="_blank"
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-cream-50 hover:bg-cream-100 text-terracotta-600 border border-cream-200 inline-flex items-center gap-1"
                    >
                      <span>Vista Pública</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setEditingTrackingOrder(selectedOrder)}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white border border-[#174B3D] inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      title="Editar Tracking ID y datos del Courier"
                    >
                      <Truck className="w-3 h-3 text-[#c6a26c]" />
                      <span>Editar Courier & Tracking</span>
                    </button>
                  </div>
                  <p className="text-xs text-stone-500">
                    Registrada el{" "}
                    {new Date(selectedOrder.created_at).toLocaleString(
                      "es-PE",
                      {
                        dateStyle: "medium",
                        timeStyle: "short",
                      },
                    )}{" "}
                    · Cliente:{" "}
                    <strong className="text-stone-800">
                      {selectedOrder.shipping?.name}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrderId(null)}
                  className="w-9 h-9 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 flex items-center justify-center self-end sm:self-auto flex-shrink-0"
                  aria-label="Cerrar detalle de orden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Control de Steps Logísticos y Cierre Financiero dentro del Modal */}
              <div className="p-4 sm:p-5 rounded-2xl bg-cream-50 border border-cream-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600 block">
                      Gestión de Estados y Entrega (Pendiente → Fabricación → En Camino → Entregado)
                    </span>
                    <p className="text-xs text-stone-600">
                      Flujo guiado: 1) Verifica pago · 2) Envía correo al proveedor (Fabricación) · 3) Completa Courier y Despacho (En Camino) · 4) Confirma Entregado.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {selectedOrder.status === "pending" && (
                      <span
                        title="Se completa automáticamente al verificar el pago 100%"
                        className="px-3.5 py-2 rounded-full border bg-amber-100 text-amber-900 border-amber-300 font-semibold flex items-center gap-1.5 shadow-soft select-none cursor-default"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pendiente</span>
                      </span>
                    )}

                    <span
                      title="Se activa automáticamente al enviar el correo al proveedor/fabricador"
                      className={`px-3.5 py-2 rounded-full border font-semibold flex items-center gap-1.5 select-none cursor-default ${
                        selectedOrder.status === "manufacturing"
                          ? "bg-stone-900 text-white border-stone-900 shadow-soft"
                          : "bg-white text-stone-500 border-cream-200"
                      }`}
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      <span>En Fabricación</span>
                    </span>

                    <span
                      title="Se activa al completar los datos de Empresa Courier y Despacho"
                      className={`px-3.5 py-2 rounded-full border font-semibold flex items-center gap-1.5 select-none cursor-default ${
                        selectedOrder.status === "in_transit"
                          ? "bg-stone-900 text-white border-stone-900 shadow-soft"
                          : "bg-white text-stone-500 border-cream-200"
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>En Camino</span>
                    </span>

                    <button
                      type="button"
                      disabled={
                        updatingOrderId === selectedOrder.id ||
                        selectedOrder.status !== "in_transit"
                      }
                      onClick={() => {
                        if (selectedOrder.status === "in_transit") {
                          handleOrderLifecycleAction(
                            selectedOrder.id,
                            "set_step_delivered",
                          );
                        }
                      }}
                      title={
                        selectedOrder.status === "in_transit"
                          ? "Clic para confirmar entrega al cliente"
                          : selectedOrder.status === "delivered" ||
                              selectedOrder.status === "completed"
                            ? "Orden ya entregada"
                            : "Disponible cuando la orden esté En Camino"
                      }
                      className={`px-3.5 py-2 rounded-full border font-semibold flex items-center gap-1.5 transition-all ${
                        selectedOrder.status === "delivered" ||
                        selectedOrder.status === "completed"
                          ? "bg-sage-600 text-white border-sage-600 shadow-soft cursor-default"
                          : selectedOrder.status === "in_transit"
                            ? "bg-white text-[#174B3D] border-[#174B3D] hover:bg-[#174B3D] hover:text-white shadow-xs cursor-pointer"
                            : "bg-white text-stone-400 border-cream-200 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Entregado</span>
                    </button>

                    {selectedOrder.status !== "completed" &&
                      selectedOrder.remaining_amount > 0 &&
                      selectedOrder.payment_status !== "paid_full" && (
                        <button
                          type="button"
                          disabled={updatingOrderId === selectedOrder.id}
                          onClick={() =>
                            handleOrderLifecycleAction(
                              selectedOrder.id,
                              "complete_final_50_payment",
                            )
                          }
                          className="px-4 py-2 rounded-full bg-sage-600 hover:bg-sage-700 text-white font-semibold flex items-center gap-1.5 shadow-soft transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {`Confirmar Saldo (S/ ${selectedOrder.remaining_amount.toFixed(2)})`}
                          </span>
                        </button>
                      )}
                  </div>
                </div>

                {/* Full Visual Stepper inside Modal */}
                <OrderTrackingStepper
                  status={selectedOrder.status}
                  paymentStatus={selectedOrder.payment_status}
                  createdAt={selectedOrder.created_at}
                  paymentVerifiedAt={
                    selectedOrder.paymentTransactions?.find(
                      (t) => t.verified_at,
                    )?.verified_at || null
                  }
                  manufacturingStartedAt={
                    selectedOrder.manufacturing_started_at
                  }
                  shippedAt={selectedOrder.shipped_at}
                  deliveredAt={selectedOrder.delivered_at}
                  completedAt={selectedOrder.completed_at}
                />
              </div>

              {/* Complete Details Grid: Print Spec + Customer/Delivery + Financial/Invoice */}
              {(() => {
                const modalItem = selectedOrder.packages?.[0]?.items?.[0];
                const bleedSpec = modalItem
                  ? resolvePrintBleedSpec(
                      {
                        sizeId: modalItem.customizations?.size_id,
                        cmDimensions:
                          modalItem.customizations?.cm_dimensions ||
                          modalItem.customizations?.size_label,
                      },
                      CANVAS_WRAP_BLEED_CM,
                    )
                  : null;
                return (
                  <div className="space-y-4 text-xs">
                    {/* Fila 1 (2 columnas): Especificación de Imprenta + Cliente y Dirección */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 1. Especificaciones de Imprenta y Arte HD */}
                    <div className="p-5 rounded-2xl bg-cream-50 border border-cream-200 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600 flex items-center gap-1.5">
                        <Frame className="w-3.5 h-3.5" />
                        <span>Especificación de Imprenta (300 DPI)</span>
                      </span>

                      {modalItem ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start">
                            {/* Columna izquierda: previews clicables (Retrato HD + Mascota Original) */}
                            <div className="flex sm:flex-col items-end sm:items-center gap-2.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const artUrl =
                                    modalItem.customizations?.master_art_url ||
                                    modalItem.generated_art_url ||
                                    "/samples/cat-suit.jpg";
                                  const inscriptionName = modalItem.customizations
                                    ?.pet_inscription?.enabled
                                    ? modalItem.customizations?.pet_inscription?.pet_name?.trim() ||
                                      null
                                    : null;
                                  setVoucherPreviewModal({
                                    url: artUrl,
                                    title: `Retrato Generado · ${selectedOrder.order_code}`,
                                    subtitle: `${modalItem.customizations?.theme_name || "Personalizado"} · ${bleedSpec?.faceCmLabel || modalItem.customizations?.size_label || ""}${inscriptionName ? ` · Nombre: "${inscriptionName}"` : ""}`,
                                    petInscriptionName: inscriptionName,
                                  });
                                }}
                                title="Clic para ver el retrato en pantalla completa"
                                className="group relative w-24 h-24 rounded-2xl overflow-hidden border border-cream-200 flex-shrink-0 shadow-soft cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
                              >
                                <img
                                  src={
                                    modalItem.customizations?.master_art_url ||
                                    modalItem.generated_art_url ||
                                    "/samples/cat-suit.jpg"
                                  }
                                  alt="Arte Generado HD"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 text-[#174B3D] text-[10px] font-bold shadow-xs">
                                    <Eye className="w-3 h-3" />
                                    <span>Ver</span>
                                  </span>
                                </span>
                              </button>
                              {modalItem.pet_photo_url && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVoucherPreviewModal({
                                      url: modalItem.pet_photo_url!,
                                      title: `Foto Original de Mascota · ${selectedOrder.order_code}`,
                                      subtitle:
                                        selectedOrder.shipping?.name ||
                                        "Subida por el cliente",
                                    })
                                  }
                                  title="Clic para ver la foto original de la mascota en pantalla completa"
                                  className="group relative w-16 h-16 rounded-2xl overflow-hidden border border-cream-200 flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
                                >
                                  <img
                                    src={modalItem.pet_photo_url}
                                    alt="Mascota Original"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="w-4 h-4 text-white drop-shadow" />
                                  </span>
                                </button>
                              )}
                            </div>

                            {/* Columna derecha: datos técnicos de impresión */}
                            <div className="space-y-1.5 text-stone-700 min-w-0">
                              <p>
                                <strong>Temática:</strong>{" "}
                                {modalItem.customizations?.theme_name ||
                                  "Personalizado"}
                              </p>
                              <p>
                                <strong>Medida del cuadro:</strong>{" "}
                                {modalItem.customizations?.size_label} (
                                {bleedSpec?.faceCmLabel ||
                                  modalItem.customizations?.cm_dimensions}
                                )
                              </p>
                              {bleedSpec && (
                                <p className="text-[#174B3D] bg-[#174B3D]/8 px-2.5 py-1.5 rounded-xl border border-[#174B3D]/20 font-medium">
                                  <strong>
                                    Medida de impresión (+{CANVAS_WRAP_BLEED_CM}{" "}
                                    cm en 4 lados):
                                  </strong>{" "}
                                  <span className="font-bold">
                                    {bleedSpec.totalCmLabel}
                                  </span>{" "}
                                  <span className="text-[10px] text-stone-600 block">
                                    Incluye +{CANVAS_WRAP_BLEED_CM} cm arriba,
                                    abajo, izquierda y derecha para remangar en el
                                    bastidor de madera.
                                  </span>
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-0.5">
                                <p>
                                  <strong>Acabado:</strong>{" "}
                                  {modalItem.customizations?.finish_label}
                                </p>
                                <p>
                                  <strong>Marco:</strong>{" "}
                                  {modalItem.customizations?.frame_name}
                                </p>
                                <p className="col-span-2">
                                  <strong>Mascotas en retrato:</strong>{" "}
                                  {modalItem.customizations?.pet_count || 1}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-stone-700">
                            {modalItem.customizations?.pet_inscription?.enabled &&
                              modalItem.customizations.pet_inscription.pet_name && (
                                <p className="text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-1 flex items-center gap-2">
                                  <PenTool className="w-4 h-4 text-[#c6a26c] shrink-0" />
                                  <span>
                                    <strong>Nombre de Mascota:</strong> &ldquo;
                                    {modalItem.customizations.pet_inscription.pet_name}
                                    &rdquo; (Brush blanco inferior derecha en diagonal)
                                  </span>
                                </p>
                              )}
                            {modalItem.customizations?.dedication_note && (
                              <div className="bg-[#FFFBF2] p-3.5 rounded-2xl border border-[#E8DEC8] mt-2 space-y-2 shadow-2xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#174B3D]">
                                    <Gift className="w-4 h-4 text-[#c6a26c] shrink-0" />
                                    <span>Dedicatoria para Regalo (Tarjeta Taller):</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      copyDedication(
                                        modalItem.customizations!.dedication_note!,
                                        `modal-${selectedOrder.id}`,
                                        e
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-[11px] font-semibold text-stone-700 shadow-2xs transition-all active:scale-95 cursor-pointer"
                                    title="Copiar dedicatoria al portapapeles"
                                  >
                                    {copiedDedicationId === `modal-${selectedOrder.id}` ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-700 font-bold">¡Copiado!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                                        <span>Copiar</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <p className="text-xs italic text-stone-700 font-serif bg-white/80 p-3 rounded-xl border border-[#E8DEC8]/80 whitespace-pre-wrap leading-relaxed">
                                  &ldquo;{modalItem.customizations.dedication_note}&rdquo;
                                </p>
                              </div>
                            )}
                            {modalItem.customizations?.notes && (
                              <p className="text-stone-600 bg-white p-2 rounded-xl border border-cream-200 mt-1">
                                <strong>Nota taller:</strong>{" "}
                                {modalItem.customizations.notes}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={
                              downloadingMasterOrderId === selectedOrder.id
                            }
                            onClick={() =>
                              handleDownloadMasterWithBleed(selectedOrder)
                            }
                            className="w-full py-2.5 px-4 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-1.5 shadow-soft transition-all cursor-pointer"
                          >
                            {downloadingMasterOrderId === selectedOrder.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-terracotta-400" />
                                <span>
                                  Generando imprenta (+{CANVAS_WRAP_BLEED_CM} cm
                                  en 4 lados)...
                                </span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5 text-terracotta-400" />
                                <span>
                                  Descargar Archivo Maestro HD (
                                  {bleedSpec
                                    ? `${bleedSpec.totalCmLabel} con +${CANVAS_WRAP_BLEED_CM} cm`
                                    : "Sin Marca"}
                                  )
                                </span>
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <p className="text-stone-500">
                          Sin especificaciones adjuntas.
                        </p>
                      )}
                    </div>

                    {/* 2. Datos Completos del Cliente y Delivery */}
                    <div className="p-5 rounded-2xl bg-cream-50 border border-cream-200 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Cliente y Dirección de Entrega</span>
                      </span>

                      <div className="space-y-1.5 text-stone-700">
                        <p className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
                          <UserCheck className="w-4 h-4 text-terracotta-500" />
                          <span>{selectedOrder.shipping?.name}</span>
                        </p>
                        <p>
                          <strong>Documento:</strong>{" "}
                          {selectedOrder.shipping?.document_type || "DNI"}{" "}
                          {selectedOrder.shipping?.document_number || "—"}
                        </p>
                        <p>
                          <strong>Correo:</strong>{" "}
                          {selectedOrder.shipping?.email}
                        </p>
                        <p className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-terracotta-500" />
                          <strong>Teléfono / WhatsApp:</strong>{" "}
                          <a
                            href={`https://wa.me/51${(selectedOrder.shipping?.phone || "").replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-terracotta-600 font-semibold hover:underline"
                          >
                            {selectedOrder.shipping?.phone}
                          </a>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-cream-200 space-y-1.5 text-stone-700">
                        <p>
                          <strong>Ubicación:</strong>{" "}
                          {selectedOrder.shipping?.district},{" "}
                          {selectedOrder.shipping?.province},{" "}
                          {selectedOrder.shipping?.department}
                        </p>
                        <p>
                          <strong>Dirección exacta:</strong>{" "}
                          {selectedOrder.shipping?.address}
                        </p>
                        {(() => {
                          const parsedLoc = parseDeliveryPinFromOrder(
                            selectedOrder.shipping?.reference,
                            selectedOrder.packages?.[0]?.items?.[0]
                              ?.customizations?.delivery_location,
                            selectedOrder.shipping,
                          );
                          return (
                            <>
                              {parsedLoc.cleanReference && (
                                <p className="text-stone-600 bg-white p-2 rounded-xl border border-cream-200">
                                  <strong>Referencia:</strong>{" "}
                                  {parsedLoc.cleanReference}
                                </p>
                              )}
                              {parsedLoc.pin && (
                                <div className="p-2.5 rounded-xl bg-[#174B3D]/5 border border-[#174B3D]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <span className="text-[11px] font-bold text-[#174B3D] flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
                                      <span>Pin Exacto en Mapa (GPS)</span>
                                    </span>
                                    <span className="font-mono text-[11px] text-stone-600 block">
                                      {parsedLoc.pin.lat.toFixed(6)},{" "}
                                      {parsedLoc.pin.lng.toFixed(6)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) =>
                                        copyDedication(
                                          parsedLoc.pin!.googleMapsUrl,
                                          `gps-modal-${selectedOrder.id}`,
                                          e,
                                        )
                                      }
                                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-cream-100 text-stone-800 border border-cream-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      {copiedDedicationId ===
                                      `gps-modal-${selectedOrder.id}` ? (
                                        <>
                                          <Check className="w-3 h-3 text-sage-600" />
                                          <span>Copiado</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3 text-stone-500" />
                                          <span>Copiar GPS</span>
                                        </>
                                      )}
                                    </button>
                                    <a
                                      href={parsedLoc.pin.googleMapsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 rounded-lg bg-[#174B3D] hover:bg-[#123B30] text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3 text-[#c6a26c]" />
                                      <span>Abrir en Google Maps</span>
                                    </a>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        {selectedOrder.notes && (
                          <p className="text-stone-600 bg-white p-2 rounded-xl border border-cream-200">
                            <strong>Notas del pedido:</strong>{" "}
                            {selectedOrder.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    </div>

                    {/* Fila 2 (3 columnas en orden operativo): 1. Finanzas -> 2. Proveedor -> 3. Courier */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* 3. Desglose Financiero, Transacciones y Comprobante */}
                    <div className="p-5 rounded-2xl bg-cream-50 border border-cream-200 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>
                          {selectedOrder.remaining_amount > 0
                            ? "Finanzas 50% / 50% y Facturación"
                            : "Finanzas (Pago 100%) y Facturación"}
                        </span>
                      </span>

                      <div className="p-3 rounded-xl bg-white border border-cream-200 space-y-1">
                        <div className="flex justify-between text-stone-600">
                          <span>Subtotal producto:</span>
                          <span>S/ {selectedOrder.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Costo de envío:</span>
                          <span>
                            S/ {selectedOrder.shipping_cost.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-cream-100 text-sm">
                          <span>Total Orden:</span>
                          <span>
                            S/ {selectedOrder.total_amount.toFixed(2)}
                          </span>
                        </div>
                        {selectedOrder.remaining_amount > 0 ? (
                          <>
                            <div className="flex justify-between text-[11px] text-sage-700 font-semibold pt-1">
                              <span>1er 50% Adelanto:</span>
                              <span>
                                S/ {selectedOrder.advance_amount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px] text-terracotta-700 font-semibold">
                              <span>2do 50% Contraentrega:</span>
                              <span>
                                S/ {selectedOrder.remaining_amount.toFixed(2)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-[11px] text-sage-700 font-semibold pt-1">
                            <span>Pago Único al Ordenar (100%):</span>
                            <span>
                              S/ {selectedOrder.advance_amount.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-semibold text-stone-800 block">
                          Transacciones Registradas:
                        </span>
                        {selectedOrder.paymentTransactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="p-2.5 rounded-xl bg-white border border-cream-200 space-y-1 text-[11px]"
                          >
                            <div className="flex items-center justify-between font-semibold text-stone-900">
                              <span>
                                {tx.payment_stage === "advance_50"
                                  ? selectedOrder.remaining_amount > 0
                                    ? "1er 50% (Adelanto)"
                                    : "Pago Total (100%)"
                                  : "2do 50% (Contraentrega)"}{" "}
                                · {tx.payment_method.toUpperCase()}
                              </span>
                              <span>S/ {tx.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-stone-500">
                              <span>
                                {tx.operation_number
                                  ? `Op: ${tx.operation_number}`
                                  : "Sin N° de operación"}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  tx.status === "verified"
                                    ? "bg-sage-100 text-sage-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {tx.status === "verified"
                                  ? "Verificado"
                                  : "Por Verificar"}
                              </span>
                            </div>

                            {tx.proof_image_url ? (
                              <div className="pt-2 mt-1.5 border-t border-cream-200 flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVoucherPreviewModal({
                                      url: tx.proof_image_url!,
                                      title: `Voucher de Pago · ${selectedOrder.order_code}`,
                                      subtitle: `${tx.payment_method.toUpperCase()} · S/ ${tx.amount.toFixed(2)}${tx.operation_number ? ` · Op: ${tx.operation_number}` : ""}`,
                                    })
                                  }
                                  className="relative w-12 h-12 rounded-lg overflow-hidden border border-cream-300 bg-cream-50 shrink-0 group cursor-pointer"
                                  title="Ampliar comprobante de pago"
                                >
                                  <img
                                    src={tx.proof_image_url}
                                    alt="Comprobante de pago"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                    <Maximize2 className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </span>
                                </button>
                                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVoucherPreviewModal({
                                        url: tx.proof_image_url!,
                                        title: `Voucher de Pago · ${selectedOrder.order_code}`,
                                        subtitle: `${tx.payment_method.toUpperCase()} · S/ ${tx.amount.toFixed(2)}${tx.operation_number ? ` · Op: ${tx.operation_number}` : ""}`,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#174B3D] hover:bg-[#123B30] text-white text-[10px] font-semibold transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Ver voucher</span>
                                  </button>
                                  <a
                                    href={tx.proof_image_url}
                                    download={`voucher-${selectedOrder.order_code}.jpg`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-cream-100 hover:bg-cream-200 border border-cream-300 text-stone-700 text-[10px] font-semibold transition-colors"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Descargar</span>
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[10px] text-stone-400 italic pt-1">
                                Sin voucher adjunto en esta transacción.
                              </p>
                            )}
                          </div>
                        ))}

                        {selectedOrder.payment_status === "partial_pending" && (
                          <button
                            type="button"
                            disabled={updatingOrderId === selectedOrder.id}
                            onClick={() =>
                              handleOrderLifecycleAction(
                                selectedOrder.id,
                                "verify_advance_50",
                              )
                            }
                            className="w-full py-2 px-3 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-soft transition-all mt-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {selectedOrder.remaining_amount > 0
                                ? "Marcar 50% de Adelanto como Verificado"
                                : "Marcar Pago 100% como Verificado"}
                            </span>
                          </button>
                        )}
                      </div>

                      {selectedOrder.invoice && (
                        <div className="pt-2 border-t border-cream-200 space-y-1 text-[11px] text-stone-600">
                          <span className="font-semibold text-stone-800 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-terracotta-500" />
                            <span>
                              Comprobante:{" "}
                              {selectedOrder.invoice.type.toUpperCase()}
                              {selectedOrder.invoice.sunat_status
                                ? ` · ${selectedOrder.invoice.sunat_status}`
                                : ""}
                            </span>
                          </span>
                          <p>
                            {selectedOrder.invoice.doc_type}:{" "}
                            {selectedOrder.invoice.number} ·{" "}
                            {selectedOrder.invoice.legal_name}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 5. Despacho a Fabricación (Proveedor / Taller) */}
                    {(() => {
                      const prevDispatch = (
                        modalItem?.customizations as any
                      )?.production_dispatch;
                      const isPaidFull =
                        selectedOrder.payment_status === "paid_full";
                      return (
                        <div className="p-5 rounded-2xl bg-cream-50 border border-cream-200 space-y-3 flex flex-col justify-between">
                          <div className="space-y-3">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600 flex items-center gap-1.5">
                              <Hammer className="w-3.5 h-3.5" />
                              <span>Despacho a Fabricación (Proveedor)</span>
                            </span>

                            <div className="p-3 rounded-xl bg-white border border-cream-200 space-y-1.5 text-[11px]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-stone-500">
                                  Proveedor por defecto:
                                </span>
                                <span className="font-semibold text-stone-900 truncate">
                                  {supplierEmailInput}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-stone-500">Estado:</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    prevDispatch?.sent_at
                                      ? "bg-emerald-100 text-emerald-800"
                                      : isPaidFull
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-stone-200 text-stone-600"
                                  }`}
                                >
                                  {prevDispatch?.sent_at
                                    ? "Enviado al proveedor"
                                    : isPaidFull
                                      ? "Listo para enviar"
                                      : "Esperando pago 100%"}
                                </span>
                              </div>
                            </div>

                            {prevDispatch?.sent_at ? (
                              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Orden despachada al taller</span>
                                </p>
                                <p>
                                  <strong>Destino:</strong>{" "}
                                  {prevDispatch.supplier_email}
                                </p>
                                <p>
                                  <strong>Fecha:</strong>{" "}
                                  {new Date(
                                    prevDispatch.sent_at,
                                  ).toLocaleString("es-PE")}
                                </p>
                                {prevDispatch.attachment_filename && (
                                  <p className="truncate">
                                    <strong>Adjunto:</strong>{" "}
                                    {prevDispatch.attachment_filename}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-[11px] text-stone-600 leading-relaxed">
                                {isPaidFull
                                  ? "El pago del 100% ya está confirmado. Envía la ficha técnica completa y el Archivo Maestro HD (+4 cm) al taller para iniciar la fabricación."
                                  : "Confirma primero el pago del 100% en Finanzas para habilitar el envío de la orden al taller."}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={!isPaidFull}
                            onClick={() => setSupplierModalOrder(selectedOrder)}
                            className={`w-full py-2.5 px-4 rounded-full font-semibold text-xs flex items-center justify-center gap-1.5 shadow-soft transition-all ${
                              isPaidFull
                                ? "bg-[#174B3D] hover:bg-[#123B30] text-white cursor-pointer"
                                : "bg-stone-200 text-stone-500 cursor-not-allowed"
                            }`}
                          >
                            <Mail className="w-3.5 h-3.5 text-[#c6a26c]" />
                            <span>
                              {isPaidFull
                                ? prevDispatch?.sent_at
                                  ? "Reenviar Orden al Proveedor"
                                  : "Enviar a Fabricación (Proveedor)"
                                : "Verifica el pago 100% para habilitar"}
                            </span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* 5. Empresa Courier y Despacho (habilitado solo desde En Fabricación en adelante) */}
                    {(() => {
                      const canEditCourier =
                        selectedOrder.status === "manufacturing" ||
                        selectedOrder.status === "in_transit" ||
                        selectedOrder.status === "delivered" ||
                        selectedOrder.status === "completed";
                      return (
                        <div
                          className={`p-5 rounded-2xl border space-y-3 flex flex-col justify-between ${
                            canEditCourier
                              ? "bg-[#FFFBF2] border-[#E8DEC8]"
                              : "bg-cream-50/70 border-cream-200 opacity-75"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#174B3D] flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-[#c6a26c]" />
                                <span>Empresa Courier y Despacho</span>
                              </span>
                              <button
                                type="button"
                                disabled={!canEditCourier}
                                onClick={() =>
                                  canEditCourier &&
                                  setEditingTrackingOrder(selectedOrder)
                                }
                                title={
                                  canEditCourier
                                    ? "Completar datos de Courier y pasar a En Camino"
                                    : "Se habilita cuando la orden pase a En Fabricación"
                                }
                                className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs ${
                                  canEditCourier
                                    ? "bg-[#174B3D] text-white hover:bg-[#134034] cursor-pointer"
                                    : "bg-stone-200 text-stone-500 cursor-not-allowed"
                                }`}
                              >
                                <Pencil className="w-3 h-3 text-[#c6a26c]" />
                                <span>Editar</span>
                              </button>
                            </div>

                            {!canEditCourier ? (
                              <div className="p-3 rounded-xl bg-white border border-cream-200 text-stone-600 text-xs leading-relaxed">
                                Envía primero la orden al proveedor para pasarla
                                a <strong>En Fabricación</strong>. Una vez en
                                fabricación, podrás completar los datos del
                                courier y cambiar el estado a{" "}
                                <strong>En Camino</strong>.
                              </div>
                            ) : (
                              <div className="space-y-1.5 text-stone-700 text-xs">
                                <p className="flex items-center gap-2">
                                  <strong>Operador:</strong>{" "}
                                  <span className="font-bold text-[#174B3D]">
                                    {selectedOrder.packages?.[0]?.courier ||
                                      "Apolena (Transporte Propio)"}
                                  </span>
                                </p>
                                <p>
                                  <strong>Tracking ID Oficial:</strong>{" "}
                                  <span className="font-mono font-bold text-stone-900">
                                    {selectedOrder.tracking_id}
                                  </span>
                                </p>
                                {selectedOrder.packages?.[0]?.tracking_number && (
                                  <p>
                                    <strong>Nro. de Guía / Código Courier:</strong>{" "}
                                    <span className="font-mono font-semibold text-stone-800">
                                      {selectedOrder.packages[0].tracking_number}
                                    </span>
                                  </p>
                                )}
                                {selectedOrder.packages?.[0]?.carrier_phone && (
                                  <p>
                                    <strong>Teléfono del Chofer / Courier:</strong>{" "}
                                    <span>
                                      {selectedOrder.packages[0].carrier_phone}
                                    </span>
                                  </p>
                                )}
                                {selectedOrder.packages?.[0]?.estimated_delivery && (
                                  <p>
                                    <strong>Entrega Estimada:</strong>{" "}
                                    <span>
                                      {new Date(
                                        selectedOrder.packages[0].estimated_delivery,
                                      ).toLocaleDateString("es-PE", {
                                        dateStyle: "long",
                                      })}
                                    </span>
                                  </p>
                                )}
                                {selectedOrder.packages?.[0]?.tracking_url && (
                                  <p className="pt-1">
                                    <a
                                      href={selectedOrder.packages[0].tracking_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#174B3D] hover:underline"
                                    >
                                      <span>Rastrear en página web del Courier</span>
                                      <ExternalLink className="w-3 h-3 text-[#c6a26c]" />
                                    </a>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        {/* Modal Lightbox para inspeccionar el Voucher / Comprobante de Pago */}
        {voucherPreviewModal && (
          <div
            className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setVoucherPreviewModal(null)}
            role="dialog"
            aria-modal="true"
            aria-label={voucherPreviewModal.title}
          >
            <div
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-cream-200 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-cream-200 flex items-center justify-between gap-3 bg-cream-50">
                <div className="min-w-0">
                  <h3 className="font-serif text-base font-bold text-stone-900 truncate">
                    {voucherPreviewModal.title}
                  </h3>
                  {voucherPreviewModal.subtitle && (
                    <p className="text-xs text-stone-500 truncate mt-0.5">
                      {voucherPreviewModal.subtitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={voucherPreviewModal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-cream-100 border border-cream-300 text-stone-700 text-xs font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setVoucherPreviewModal(null)}
                    aria-label="Cerrar vista de voucher"
                    className="w-8 h-8 rounded-full bg-white hover:bg-cream-200 border border-cream-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-stone-950/95 flex items-center justify-center overflow-auto flex-1">
                <div className="relative inline-block max-w-full">
                  <img
                    src={voucherPreviewModal.url}
                    alt={voucherPreviewModal.title}
                    className="max-h-[72vh] w-auto max-w-full object-contain rounded-xl shadow-lg block"
                  />
                  {voucherPreviewModal.petInscriptionName && (
                    <span
                      className="font-brush pointer-events-none select-none absolute bottom-4 right-5 sm:bottom-6 sm:right-7 -rotate-[6.5deg] text-white text-2xl sm:text-4xl tracking-wide leading-none"
                      style={{
                        textShadow:
                          "0 2px 10px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)",
                      }}
                    >
                      {voucherPreviewModal.petInscriptionName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Envío de Orden de Fabricación al Proveedor */}
        <SendToSupplierModal
          order={supplierModalOrder}
          defaultSupplierEmail={supplierEmailInput}
          onClose={() => setSupplierModalOrder(null)}
          onSentSuccess={(msg) => {
            showToast("success", msg);
            void loadAdminData();
          }}
        />

        {/* Modal de confirmación genérico para acciones del Admin */}
        <ConfirmModal
          open={confirmModalData.open}
          onOpenChange={(open) =>
            setConfirmModalData((prev) => ({ ...prev, open }))
          }
          title={confirmModalData.title}
          description={confirmModalData.description}
          variant={confirmModalData.variant}
          onConfirm={confirmModalData.action}
        />
        {/* Modal de edición de expediente de orden */}
        <EditOrderModal
          order={editingOrder}
          open={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          onOrderUpdated={handleOrderUpdated}
        />
        {/* Modal de edición de Tracking ID y Courier */}
        <EditTrackingModal
          order={editingTrackingOrder}
          open={!!editingTrackingOrder}
          onClose={() => setEditingTrackingOrder(null)}
          onOrderUpdated={(updated) => {
            handleOrderUpdated(updated);
            showToast(
              "success",
              `Tracking y Courier de la orden ${updated.order_code} actualizados correctamente.`,
            );
          }}
        />
        {/* Modal de confirmación para eliminar orden y registros relacionados */}
        {deletingOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={() => {
              if (!isDeletingOrder) setDeletingOrder(null);
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative w-full max-w-md rounded-3xl bg-[#FFFBF2] border border-red-200 shadow-2xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Eliminar orden {deletingOrder.order_code}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Esta acción eliminará permanentemente la orden (
                    <strong>{deletingOrder.tracking_id}</strong>), sus paquetes,
                    envíos, pagos, comprobantes, reseñas, correos en cola,
                    trabajos de generación y archivos multimedia asociados. No
                    se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-cream-200 p-3.5 text-xs space-y-1 text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500">Cliente:</span>
                  <span className="font-semibold">
                    {deletingOrder.shipping?.name || "Sin nombre"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total:</span>
                  <span className="font-bold text-stone-900">
                    S/ {Number(deletingOrder.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isDeletingOrder}
                  onClick={() => setDeletingOrder(null)}
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-cream-100 border border-cream-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeletingOrder}
                  onClick={handleConfirmDeleteOrder}
                  className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isDeletingOrder ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sí, eliminar orden</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
