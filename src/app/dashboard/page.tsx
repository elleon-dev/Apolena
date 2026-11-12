"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { EditOrderModal } from "@/components/EditOrderModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { OrderTrackingStepper } from "@/components/OrderTrackingStepper";
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
  Palette,
  Ruler,
  ImagePlus,
  Layers,
  Save,
  Upload,
  RefreshCw,
  SlidersHorizontal,
  PenTool,
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
import type { PrintPreset, FrameOption } from "@/lib/print-export";
import type { UserRole } from "@/lib/auth";

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
  if (order.status === "completed") return 50;
  // Si aún falta verificar el 50% de adelanto, máxima alerta (Prioridad 1)
  if (order.payment_status === "partial_pending") return 1;
  // Paso 1: En Fabricación
  if (order.status === "manufacturing") return 2;
  // Paso 2: En Camino
  if (order.status === "in_transit") return 3;
  // Paso 3: Entregado pero pendiente de confirmar 2do 50% contraentrega
  if (order.status === "delivered") return 4;
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
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [settings, setSettings] = useState<PlatformSettingsMap | null>(null);

  // Dynamic Cuadros Personalizados Configurator State
  const [cuadrosSection, setCuadrosSection] = useState<
    "characters" | "frames" | "sizes" | "finishes"
  >("characters");
  const [isSavingCuadros, setIsSavingCuadros] = useState(false);

  // Character Modal State
  const [showCharacterModal, setShowCharacterModal] = useState(false);
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
    | "manufacturing"
    | "in_transit"
    | "delivered"
    | "completed"
  >("priority_all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);
  
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);

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
      setOrders(data.orders || []);
      setUsers(data.users || []);
      setEmailQueue(data.emailQueue || []);
      setProducts(data.products || []);
      setSettings(data.settings || null);
    } catch {
      window.location.replace("/orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
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
      setConfirmModalData({
        open: true,
        title: "Aprobar Pago",
        description: `¿Confirmas que el adelanto del 50% de la orden ${orderCode} fue recibido y deseas aprobarlo?`,
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
        if (order.status === "completed" || order.status === "cancelled") {
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
          prev.map((p) => (p.id === wallArtProduct.id ? data.product : p)),
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
      alert("Por favor, sube o selecciona una imagen para el personaje.");
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
      : [...currentChars.filter((c) => c.id !== cleanId), characterRecord];

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
  const openCreateFrameModal = () => {
    setEditingFrameId(null);
    setFrameForm({
      id: `frame-${Date.now().toString().slice(-5)}`,
      name: "",
      description: "",
      priceModifierPen: 45,
      colorHex: "#5C3A21",
      isAvailable: true,
    });
    setShowFrameModal(true);
  };

  const openEditFrameModal = (frame: FrameOption) => {
    setEditingFrameId(frame.id);
    setFrameForm({
      ...frame,
      isAvailable: frame.isAvailable !== false,
    });
    setShowFrameModal(true);
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

    const frameRecord: FrameOption = {
      ...frameForm,
      id: cleanId,
      priceModifierPen: Number(frameForm.priceModifierPen) || 0,
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
      pricePen: 250,
      isAvailable: true,
    });
    setShowSizeModal(true);
  };

  const openEditSizeModal = (preset: PrintPreset) => {
    setEditingSizeId(preset.id);
    setSizeForm({
      ...preset,
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
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
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

  // KPI Counters
  const totalManufacturing = orders.filter(
    (o) => o.status === "manufacturing",
  ).length;
  const totalInTransit = orders.filter((o) => o.status === "in_transit").length;
  const totalDelivered = orders.filter((o) => o.status === "delivered").length;
  const totalCompleted = orders.filter((o) => o.status === "completed").length;
  const totalActivePending =
    totalManufacturing + totalInTransit + totalDelivered;
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
              setOrderStatusFilter("manufacturing");
            }}
            className={`text-left bg-white border rounded-2xl p-4 sm:p-5 shadow-soft transition-all hover:border-terracotta-400 ${
              orderStatusFilter === "manufacturing" && activeTab === "orders"
                ? "border-terracotta-500 ring-2 ring-terracotta-500/15"
                : "border-cream-200"
            }`}
          >
            <span className="text-[11px] font-medium text-stone-500 block">
              Paso 1 · En Fabricación
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
            className={`text-left bg-white border rounded-2xl p-4 sm:p-5 shadow-soft transition-all hover:border-terracotta-400 ${
              orderStatusFilter === "in_transit" && activeTab === "orders"
                ? "border-terracotta-500 ring-2 ring-terracotta-500/15"
                : "border-cream-200"
            }`}
          >
            <span className="text-[11px] font-medium text-stone-500 block">
              Paso 2 · En Camino
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
            className={`text-left bg-white border rounded-2xl p-4 sm:p-5 shadow-soft transition-all hover:border-terracotta-400 ${
              orderStatusFilter === "delivered" && activeTab === "orders"
                ? "border-terracotta-500 ring-2 ring-terracotta-500/15"
                : "border-cream-200"
            }`}
          >
            <span className="text-[11px] font-medium text-stone-500 block">
              Paso 3 · Entregados (Por Cobrar)
            </span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-terracotta-600 mt-1">
              {totalDelivered}
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("orders");
              setOrderStatusFilter("completed");
            }}
            className={`text-left bg-white border rounded-2xl p-4 sm:p-5 shadow-soft transition-all hover:border-sage-400 ${
              orderStatusFilter === "completed" && activeTab === "orders"
                ? "border-sage-600 ring-2 ring-sage-600/15"
                : "border-sage-200"
            }`}
          >
            <span className="text-[11px] font-semibold text-sage-700 block">
              Exitosos (100% Pagado)
            </span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-sage-700 mt-1">
              {totalCompleted}
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
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`relative px-5 py-3.5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 rounded-t-2xl border-b-2 ${
                activeTab === "orders"
                  ? "border-terracotta-500 text-stone-900 bg-white shadow-xs"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-white/60"
              }`}
            >
              <Hammer
                className={`w-4 h-4 ${
                  activeTab === "orders"
                    ? "text-terracotta-500"
                    : "text-stone-400"
                }`}
              />
              <span>Gestión de Órdenes</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
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
              className={`relative px-5 py-3.5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 rounded-t-2xl border-b-2 ${
                activeTab === "cuadros"
                  ? "border-terracotta-500 text-stone-900 bg-white shadow-xs"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-white/60"
              }`}
            >
              <Frame
                className={`w-4 h-4 ${
                  activeTab === "cuadros"
                    ? "text-terracotta-500"
                    : "text-stone-400"
                }`}
              />
              <span>Cuadros Personalizados</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
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
              className={`relative px-5 py-3.5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 rounded-t-2xl border-b-2 ${
                activeTab === "users"
                  ? "border-terracotta-500 text-stone-900 bg-white shadow-xs"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-white/60"
              }`}
            >
              <Users
                className={`w-4 h-4 ${
                  activeTab === "users"
                    ? "text-terracotta-500"
                    : "text-stone-400"
                }`}
              />
              <span>Usuarios y Roles</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
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
              className={`relative px-5 py-3.5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 rounded-t-2xl border-b-2 ${
                activeTab === "settings"
                  ? "border-terracotta-500 text-stone-900 bg-white shadow-xs"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-white/60"
              }`}
            >
              <Settings
                className={`w-4 h-4 ${
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
              className={`relative px-5 py-3.5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 rounded-t-2xl border-b-2 ${
                activeTab === "emails"
                  ? "border-terracotta-500 text-stone-900 bg-white shadow-xs"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-white/60"
              }`}
            >
              <Mail
                className={`w-4 h-4 ${
                  activeTab === "emails"
                    ? "text-terracotta-500"
                    : "text-stone-400"
                }`}
              />
              <span>Notificaciones</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
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

        {activeTab === "orders" ? (
          /* ================================================================= */
          /* TAB 1: CARDS RESUMIDAS CON PRIORIDAD + MODAL DE DETALLE COMPLETO  */
          /* ================================================================= */
          <div className="space-y-5">
            {/* Operational Alert Banner when there are active or unverified orders */}
            {totalActivePending > 0 ? (
              <div className="bg-terracotta-50 border border-terracotta-200 rounded-2xl p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-terracotta-500 text-white flex items-center justify-center flex-shrink-0 shadow-soft">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-stone-900">
                      Atención Prioritaria: Tienes {totalActivePending}{" "}
                      {totalActivePending === 1
                        ? "orden activa pendiente"
                        : "órdenes activas pendientes"}{" "}
                      de gestión hasta su entrega
                      {totalUnverifiedAdvance > 0 &&
                        ` (${totalUnverifiedAdvance} por verificar adelanto del 50%)`}
                      .
                    </p>
                    <p className="text-stone-600 mt-0.5">
                      Las órdenes más recientes y con pasos pendientes se
                      muestran primero. Haz clic en cualquier tarjeta para abrir
                      su expediente completo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter("active_pending")}
                  className="px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0 transition-all"
                >
                  <span>Ver Solo Pendientes ({totalActivePending})</span>
                </button>
              </div>
            ) : (
              <div className="bg-sage-50/80 border border-sage-200 rounded-2xl p-3.5 sm:px-5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-sage-800">
                  <CheckCircle2 className="w-4 h-4 text-sage-600 flex-shrink-0" />
                  <span>
                    <strong>Todo al día.</strong> No hay órdenes con entregas
                    pendientes en este momento. Las nuevas órdenes aparecerán en
                    primer lugar automáticamente.
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
                    id: "manufacturing",
                    label: `1. Fabricación (${totalManufacturing})`,
                  },
                  {
                    id: "in_transit",
                    label: `2. En Camino (${totalInTransit})`,
                  },
                  {
                    id: "delivered",
                    label: `3. Entregado (${totalDelivered})`,
                  },
                  {
                    id: "completed",
                    label: `Exitoso (${totalCompleted})`,
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
                    order.status !== "completed" &&
                    order.status !== "cancelled";
                  const needsAdvanceVerification =
                    order.payment_status === "partial_pending" &&
                    order.status !== "cancelled";

                  const stepBadge =
                    order.status === "manufacturing"
                      ? {
                          label: "Paso 1 · En Fabricación",
                          cls: "bg-amber-50 text-amber-800 border-amber-200",
                          progress: 1,
                        }
                      : order.status === "in_transit"
                        ? {
                            label: "Paso 2 · En Camino",
                            cls: "bg-sky-50 text-sky-800 border-sky-200",
                            progress: 2,
                          }
                        : order.status === "delivered"
                          ? {
                              label: "Paso 3 · Entregado (Cobrar 50%)",
                              cls: "bg-terracotta-50 text-terracotta-700 border-terracotta-200",
                              progress: 3,
                            }
                          : {
                              label: "Exitoso (100% Pagado)",
                              cls: "bg-sage-100 text-sage-800 border-sage-200",
                              progress: 4,
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
                              {isPendingOrder && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-terracotta-500 text-white text-[10px] font-bold uppercase tracking-wider">
                                  Pendiente
                                </span>
                              )}
                              <span className="text-sm font-bold text-stone-900">
                                {order.order_code}
                              </span>
                              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(order.created_at)}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-stone-800 truncate">
                              {order.shipping?.name || "Cliente Apolena"}
                            </p>
                            <p className="text-[11px] text-stone-500 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-terracotta-500 flex-shrink-0" />
                              <span>
                                {order.shipping?.district},{" "}
                                {order.shipping?.department} ·{" "}
                                {order.shipping?.phone}
                              </span>
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
                                  : "50% Por Verificar"}
                            </span>
                          </div>
                        </div>
                      </div>

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
                              <span>Verificar 50%</span>
                            </button>
                          )}

                          {order.status === "manufacturing" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={(e) =>
                                handleOrderLifecycleAction(
                                  order.id,
                                  "set_step_in_transit",
                                  e,
                                )
                              }
                              className="px-3 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold flex items-center gap-1 transition-all"
                            >
                              <Truck className="w-3 h-3 text-terracotta-400" />
                              <span>Pasar a En Camino</span>
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

                         {order.status === "delivered" && (
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
                                Confirmar 2do 50% (S/{" "}
                                {order.remaining_amount.toFixed(0)})
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
                      Agrega nuevas temáticas, cambia imágenes de referencia o
                      activa/oculta personajes en el Estudio IA.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSavingCuadros}
                    onClick={openCreateCharacterModal}
                    className="px-4 py-2.5 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold shadow-soft flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Personaje / Escena</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(wallArtConfig.characters || []).map((char, charIdx) => {
                    const isActive = char.isAvailable !== false;
                    return (
                      <div
                        key={`char-${char.id}-${charIdx}`}
                        className={`bg-white border rounded-3xl p-5 shadow-soft flex flex-col justify-between gap-4 transition-all ${
                          isActive
                            ? "border-cream-200"
                            : "border-stone-200 opacity-65"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-cream-200 bg-cream-100 flex-shrink-0">
                            <img
                              src={char.characterImageUrl}
                              alt={char.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

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
                            <div
                              className="w-12 h-12 rounded-2xl border-2 border-stone-200 flex-shrink-0 shadow-inner"
                              style={{ backgroundColor: frame.colorHex }}
                              title={`Color Hex: ${frame.colorHex}`}
                            />
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
                                {preset.tier} · {preset.cmDimensions}
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

                          <span className="px-3.5 py-1.5 rounded-full bg-stone-900 text-white text-xs font-bold whitespace-nowrap">
                            S/ {preset.pricePen.toFixed(2)}
                          </span>
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
                          <img
                            src={charForm.characterImageUrl}
                            alt="Vestuario de referencia"
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-cream-200 shadow-soft bg-white shrink-0"
                          />

                          <div className="flex-1 space-y-2.5 w-full text-left">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-semibold text-stone-900 block text-xs">
                                  Vestuario cargado exitosamente
                                </span>
                                <span className="text-[11px] text-stone-500">
                                  Listo para procesar o personalizar.
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
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

            {/* MODAL: CREAR / EDITAR MARCO DE CUADRO */}
            {showFrameModal && (
              <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white border border-cream-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-hover space-y-5">
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
                          Precio Base en Soles (S/)
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
          /* TAB 3: CONFIGURACIÓN DE APOLENA Y CATÁLOGO                        */
          /* ================================================================= */
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
        ) : (
          /* ================================================================= */
          /* TAB 4: COLA DE CORREOS TRANSACCIONALES (email_queue)              */
          /* ================================================================= */
          <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              Historial de Notificaciones en <code>email_queue</code>
            </h2>
            <p className="text-xs text-stone-500">
              Registro auditable de todos los correos enviados automáticamente
              al usuario comprador y a los administradores.
            </p>

            {emailQueue.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">
                Aún no hay correos encolados. Crea una orden para ver las
                notificaciones automáticas.
              </p>
            ) : (
              <div className="space-y-3">
                {emailQueue.map((mail) => (
                  <div
                    key={mail.id}
                    className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-800 font-semibold text-[10px] uppercase">
                          {mail.status}
                        </span>
                        <span className="font-mono text-stone-500">
                          {mail.template}
                        </span>
                      </div>
                      <p className="font-semibold text-stone-900">
                        {mail.subject}
                      </p>
                      <p className="text-stone-600">
                        Para: <strong>{mail.to_email}</strong>
                        {mail.cc?.length > 0 && ` (CC: ${mail.cc.join(", ")})`}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-stone-400">
                      {new Date(mail.created_at).toLocaleString("es-PE")}
                    </span>
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
                      Gestión de Estados y Entrega (3 Pasos + Exitoso)
                    </span>
                    <p className="text-xs text-stone-600">
                      Actualiza el paso actual de la orden; el cliente verá el
                      avance en tiempo real con su Tracking ID.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      type="button"
                      disabled={updatingOrderId === selectedOrder.id}
                      onClick={() =>
                        handleOrderLifecycleAction(
                          selectedOrder.id,
                          "set_step_manufacturing",
                        )
                      }
                      className={`px-3.5 py-2 rounded-full border font-semibold flex items-center gap-1.5 transition-all ${
                        selectedOrder.status === "manufacturing"
                          ? "bg-stone-900 text-white border-stone-900 shadow-soft"
                          : "bg-white text-stone-700 border-cream-200 hover:bg-cream-100"
                      }`}
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      <span>1. Fabricación</span>
                    </button>

                    <button
                      type="button"
                      disabled={updatingOrderId === selectedOrder.id}
                      onClick={() =>
                        handleOrderLifecycleAction(
                          selectedOrder.id,
                          "set_step_in_transit",
                        )
                      }
                      className={`px-3.5 py-2 rounded-full border font-semibold flex items-center gap-1.5 transition-all ${
                        selectedOrder.status === "in_transit"
                          ? "bg-stone-900 text-white border-stone-900 shadow-soft"
                          : "bg-white text-stone-700 border-cream-200 hover:bg-cream-100"
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>2. En Camino</span>
                    </button>

                    <button
                      type="button"
                      disabled={updatingOrderId === selectedOrder.id}
                      onClick={() =>
                        handleOrderLifecycleAction(
                          selectedOrder.id,
                          "set_step_delivered",
                        )
                      }
                      className={`px-3.5 py-2 rounded-full border font-semibold flex items-center gap-1.5 transition-all ${
                        selectedOrder.status === "delivered"
                          ? "bg-stone-900 text-white border-stone-900 shadow-soft"
                          : "bg-white text-stone-700 border-cream-200 hover:bg-cream-100"
                      }`}
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>3. Entregado</span>
                    </button>

                    {selectedOrder.status !== "completed" && (
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
                          Confirmar 2do 50% (S/{" "}
                          {selectedOrder.remaining_amount.toFixed(2)}) y Marcar
                          EXITOSO
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Full Visual Stepper inside Modal */}
                <OrderTrackingStepper
                  status={selectedOrder.status}
                  paymentStatus={selectedOrder.payment_status}
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
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                    {/* 1. Especificaciones de Imprenta y Arte HD */}
                    <div className="p-5 rounded-2xl bg-cream-50 border border-cream-200 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600 flex items-center gap-1.5">
                        <Frame className="w-3.5 h-3.5" />
                        <span>Especificación de Imprenta (300 DPI)</span>
                      </span>

                      {modalItem ? (
                        <>
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                modalItem.customizations?.master_art_url ||
                                modalItem.generated_art_url ||
                                "/samples/cat-suit.jpg"
                              }
                              alt="Arte Generado HD"
                              className="w-24 h-24 rounded-2xl object-cover border border-cream-200 flex-shrink-0 shadow-soft"
                            />
                            {modalItem.pet_photo_url && (
                              <img
                                src={modalItem.pet_photo_url}
                                alt="Mascota Original"
                                title="Foto original subida por el cliente"
                                className="w-16 h-16 rounded-2xl object-cover border border-cream-200 flex-shrink-0"
                              />
                            )}
                          </div>

                          <div className="space-y-1 text-stone-700 pt-1">
                            <p>
                              <strong>Temática:</strong>{" "}
                              {modalItem.customizations?.theme_name ||
                                "Personalizado"}
                            </p>
                            <p>
                              <strong>Medida:</strong>{" "}
                              {modalItem.customizations?.size_label} (
                              {modalItem.customizations?.cm_dimensions})
                            </p>
                            <p>
                              <strong>Acabado:</strong>{" "}
                              {modalItem.customizations?.finish_label}
                            </p>
                            <p>
                              <strong>Marco:</strong>{" "}
                              {modalItem.customizations?.frame_name}
                            </p>
                            <p>
                              <strong>Mascotas en retrato:</strong>{" "}
                              {modalItem.customizations?.pet_count || 1}
                            </p>
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
                            {modalItem.customizations?.notes && (
                              <p className="text-stone-600 bg-white p-2 rounded-xl border border-cream-200 mt-1">
                                <strong>Nota taller:</strong>{" "}
                                {modalItem.customizations.notes}
                              </p>
                            )}
                          </div>

                          <a
                            href={
                              modalItem.customizations?.master_art_url ||
                              modalItem.generated_art_url ||
                              "/samples/cat-suit.jpg"
                            }
                            download={`Orden-${selectedOrder.order_code}-300DPI.png`}
                            className="w-full py-2.5 px-4 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold flex items-center justify-center gap-1.5 shadow-soft transition-all"
                          >
                            <Download className="w-3.5 h-3.5 text-terracotta-400" />
                            <span>
                              Descargar Archivo Maestro HD (Sin Marca)
                            </span>
                          </a>
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

                      <div className="pt-2 border-t border-cream-200 space-y-1 text-stone-700">
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
                        {selectedOrder.shipping?.reference && (
                          <p className="text-stone-600 bg-white p-2 rounded-xl border border-cream-200">
                            <strong>Referencia:</strong>{" "}
                            {selectedOrder.shipping.reference}
                          </p>
                        )}
                        {selectedOrder.notes && (
                          <p className="text-stone-600 bg-white p-2 rounded-xl border border-cream-200">
                            <strong>Notas del pedido:</strong>{" "}
                            {selectedOrder.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 3. Desglose Financiero 50%/50%, Transacciones y Comprobante */}
                    <div className="p-5 rounded-2xl bg-cream-50 border border-cream-200 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Finanzas 50% / 50% y Facturación</span>
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
                                  ? "1er 50% (Adelanto)"
                                  : "2do 50% (Contraentrega)"}{" "}
                                · {tx.payment_method.toUpperCase()}
                              </span>
                              <span>S/ {tx.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-stone-500">
                              <span>Op: {tx.operation_number}</span>
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
                            <span>Marcar 50% de Adelanto como Verificado</span>
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
                  </div>
                );
              })()}
            </div>
          </div>
        )}
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
      </main>
    </div>
  );
}
