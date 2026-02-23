import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { apiClient } from "@/lib/api";
import { showErrorToast } from "@/lib/toastUtils";
import { Loader2 } from "lucide-react";

const ACCESS_TOKEN_EXPIRES_IN_SEC = 900; // 15 min

export default function LoginPage() {
	const navigate = useNavigate();
	const accessToken = useAuthStore((s) => s.accessToken);
	const setTokens = useAuthStore((s) => s.setTokens);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// If already authenticated, redirect to app
	useEffect(() => {
		if (accessToken) {
			navigate("/", { replace: true });
		}
	}, [accessToken, navigate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || !password) return;
		setSubmitting(true);
		try {
			const { data } = await apiClient.post<{
				accessToken: string;
				refreshToken: string;
				expiresIn?: number;
			}>("/auth/login", { email: email.trim(), password });
			const expiresIn = data.expiresIn ?? ACCESS_TOKEN_EXPIRES_IN_SEC;
			setTokens(data.accessToken, data.refreshToken, expiresIn);
			navigate("/", { replace: true });
		} catch (err: unknown) {
			const message =
				(err as { response?: { data?: { message?: string }; status?: number } })?.response?.data
					?.message ||
				(err as { message?: string })?.message ||
				"Falha ao fazer login. Verifique suas credenciais.";
			showErrorToast(message);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30">
			<Card className="w-full max-w-md shadow-xl border-border/80 overflow-hidden">
				<CardHeader className="p-0">
					<div className="pt-10 px-8 pb-6 text-center">
						<img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain mx-auto" />
					</div>
					<div className="mx-8 rounded-lg bg-primary/10 border border-primary/20 px-6 py-3 mb-6 text-center space-y-0.5">
						<CardTitle className="text-lg font-semibold tracking-tight text-muted-foreground">
							Entrar
						</CardTitle>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Use seu email e senha para acessar
						</p>
					</div>
				</CardHeader>
				<CardContent className="px-8 pt-6 pb-8">
					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="seu@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								autoComplete="email"
								disabled={submitting}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Senha</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoComplete="current-password"
								disabled={submitting}
								required
							/>
						</div>
						<Button type="submit" className="w-full" disabled={submitting}>
							{submitting ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Entrando...
								</>
							) : (
								"Entrar"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
