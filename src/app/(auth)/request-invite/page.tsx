// src/app/(auth)/request-invite/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, Mail, Phone, Building2, MapPin, Wheat, ArrowLeft } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Select,
} from "@/components/ui";

const Logo = () => (
  <div className="relative h-[62.5px] w-56">
    <Image
      src="/logo-branco.png"
      alt="Agro Efficace Logo"
      fill
      className="object-contain"
      priority
    />
  </div>
);

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const CULTURES = [
  { value: "CANA", label: "Cana-de-açúcar" },
  { value: "MILHO", label: "Milho" },
  { value: "SOJA", label: "Soja" },
  { value: "EUCALIPTO", label: "Eucalipto" },
  { value: "CAFE", label: "Café" },
  { value: "ALGODAO", label: "Algodão" },
];

const PROJECT_TYPES = [
  { value: "DANINHAS", label: "Detecção de Daninhas" },
  { value: "FALHAS", label: "Detecção de Falhas" },
  { value: "RESTITUICAO", label: "Restituição" },
  { value: "MAPEAMENTO", label: "Mapeamento" },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  state: string;
  cultures: string[];
  farmSize: string;
  projectTypes: string[];
  message: string;
}

export default function RequestInvitePage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    state: "",
    cultures: [],
    farmSize: "",
    projectTypes: [],
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field: "cultures" | "projectTypes", value: string) => {
    setFormData((prev) => {
      const currentValues = prev[field];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/invite-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao enviar solicitação. Tente novamente.");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Error submitting invite request:", err);
      setError("Erro ao conectar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-lg py-8">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mb-4 text-6xl">✅</div>
              <h2 className="mb-2 text-lg font-bold text-white sm:text-xl">
                Solicitação Enviada!
              </h2>
              <p className="mb-6 text-zinc-400">
                Recebemos sua solicitação de convite. Nossa equipe analisará suas
                informações e entrará em contato em breve.
              </p>
              <Link href="/login">
                <Button variant="secondary" fullWidth>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg py-8">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitar Convite</CardTitle>
          <CardDescription>
            Preencha o formulário abaixo e nossa equipe entrará em contato
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Required Fields Section */}
            <div className="space-y-4">
              <Input
                label="Nome completo"
                name="name"
                type="text"
                placeholder="Seu nome completo"
                icon={<User className="h-5 w-5" />}
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />

              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                icon={<Mail className="h-5 w-5" />}
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />

              <Input
                label="Telefone / WhatsApp"
                name="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                icon={<Phone className="h-5 w-5" />}
                value={formData.phone}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-800" />

            {/* Optional Fields Section */}
            <div className="space-y-4">
              <Input
                label="Empresa / Fazenda"
                name="company"
                type="text"
                placeholder="Nome da empresa ou fazenda"
                icon={<Building2 className="h-5 w-5" />}
                value={formData.company}
                onChange={handleInputChange}
                disabled={isLoading}
              />

              <Select
                label="Estado"
                name="state"
                options={BRAZILIAN_STATES}
                placeholder="Selecione o estado"
                value={formData.state}
                onChange={handleInputChange}
                disabled={isLoading}
              />

              <Input
                label="Área estimada (hectares)"
                name="farmSize"
                type="text"
                placeholder="Ex: 500"
                icon={<MapPin className="h-5 w-5" />}
                value={formData.farmSize}
                onChange={handleInputChange}
                disabled={isLoading}
              />

              {/* Cultures Multi-select */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Culturas de interesse
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CULTURES.map((culture) => (
                    <label
                      key={culture.value}
                      className={`
                        flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all
                        ${formData.cultures.includes(culture.value)
                          ? "border-green-500/50 bg-green-500/10 text-green-400"
                          : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={formData.cultures.includes(culture.value)}
                        onChange={() => handleCheckboxChange("cultures", culture.value)}
                        disabled={isLoading}
                      />
                      <Wheat className="h-4 w-4" />
                      {culture.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Project Types Multi-select */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Tipo de análise desejada
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PROJECT_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`
                        flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all
                        ${formData.projectTypes.includes(type.value)
                          ? "border-green-500/50 bg-green-500/10 text-green-400"
                          : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={formData.projectTypes.includes(type.value)}
                        onChange={() => handleCheckboxChange("projectTypes", type.value)}
                        disabled={isLoading}
                      />
                      {type.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Message Textarea */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Mensagem / Observações
                </label>
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Conte-nos um pouco mais sobre suas necessidades..."
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="
                    w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-white
                    placeholder-zinc-500 transition-all resize-none
                    focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:border-zinc-700 focus:ring-green-500/20
                  "
                />
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar Solicitação"}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-400 hover:text-zinc-300"
              >
                <ArrowLeft className="mr-1 inline h-4 w-4" />
                Voltar para login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
