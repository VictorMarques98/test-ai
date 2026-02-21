import { useState, useEffect, useCallback } from "react";
import { customersAPI } from "@/lib/apiService";
import type { BackendCustomer, CreateCustomerDto, UpdateCustomerDto } from "@/types/backend";
import { toast } from "sonner";

/**
 * Hook for managing customers with API integration
 * Provides CRUD operations with loading and error states
 */
export function useCustomers() {
	const [customers, setCustomers] = useState<BackendCustomer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch all customers
	const fetchCustomers = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await customersAPI.getAll();
			setCustomers(data);
		} catch (err: any) {
			const errorMessage = err.message || "Erro ao carregar clientes";
			setError(errorMessage);
			toast.error(errorMessage);
			console.error("Error fetching customers:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	// Create new customer
	const createCustomer = useCallback(
		async (data: CreateCustomerDto): Promise<BackendCustomer | null> => {
			try {
				const newCustomer = await customersAPI.create(data);
				setCustomers((prev) => [...prev, newCustomer]);
				toast.success("Cliente criado com sucesso!");
				return newCustomer;
			} catch (err: any) {
				const errorMessage = err.message || "Erro ao criar cliente";
				toast.error(errorMessage);
				console.error("Error creating customer:", err);
				return null;
			}
		},
		[]
	);

	// Update existing customer
	const updateCustomer = useCallback(
		async (id: string, data: UpdateCustomerDto): Promise<boolean> => {
			try {
				const updatedCustomer = await customersAPI.update(id, data);
				setCustomers((prev) => prev.map((c) => (c.id === id ? updatedCustomer : c)));
				toast.success("Cliente atualizado com sucesso!");
				return true;
			} catch (err: any) {
				const errorMessage = err.message || "Erro ao atualizar cliente";
				toast.error(errorMessage);
				console.error("Error updating customer:", err);
				return false;
			}
		},
		[]
	);

	// Delete customer
	const deleteCustomer = useCallback(async (id: string): Promise<boolean> => {
		try {
			await customersAPI.delete(id);
			setCustomers((prev) => prev.filter((c) => c.id !== id));
			toast.success("Cliente removido com sucesso!");
			return true;
		} catch (err: any) {
			const errorMessage = err.message || "Erro ao remover cliente";
			toast.error(errorMessage);
			console.error("Error deleting customer:", err);
			return false;
		}
	}, []);

	// Get customer by ID
	const getCustomerById = useCallback(
		(id: string): BackendCustomer | undefined => {
			return customers.find((c) => c.id === id);
		},
		[customers]
	);

	// Load customers on mount
	useEffect(() => {
		fetchCustomers();
	}, [fetchCustomers]);

	return {
		customers,
		loading,
		error,
		fetchCustomers,
		createCustomer,
		updateCustomer,
		deleteCustomer,
		getCustomerById,
	};
}
