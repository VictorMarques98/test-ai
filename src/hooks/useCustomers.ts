import { useState, useEffect, useCallback } from "react";
import { customersAPI } from "@/lib/apiService";
import type { BackendCustomer, CreateCustomerDto, UpdateCustomerDto, PaginationParams, PaginatedResponse } from "@/types/backend";

/**
 * Hook for managing customers with API integration
 * Provides CRUD operations with loading and error states
 * Supports pagination
 */
export function useCustomers() {
	const [customers, setCustomers] = useState<BackendCustomer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(20);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);

	// Fetch customers with pagination
	const fetchCustomers = useCallback(async (paginationParams?: PaginationParams) => {
		try {
			setLoading(true);
			setError(null);
			const params = paginationParams || { page, limit };
			const response = await customersAPI.getAll(params);
			setCustomers(response.data);
			setPage(response.page);
			setLimit(response.limit);
			setTotalPages(response.totalPages);
			setTotal(response.total);
		} catch (err: any) {
			const errorMessage = err.message || "Erro ao carregar clientes";
			setError(errorMessage);
			console.error("Error fetching customers:", err);
		} finally {
			setLoading(false);
		}
	}, [page, limit]);

	// Create new customer
	const createCustomer = useCallback(
		async (data: CreateCustomerDto): Promise<BackendCustomer | null> => {
			try {
				const newCustomer = await customersAPI.create(data);
				setCustomers((prev) => [...prev, newCustomer]);
				return newCustomer;
			} catch (err: any) {
				console.error("Error creating customer:", err);
				throw err;
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
				return true;
			} catch (err: any) {
				console.error("Error updating customer:", err);
				throw err;
			}
		},
		[]
	);

	// Delete customer
	const deleteCustomer = useCallback(async (id: string): Promise<boolean> => {
		try {
			await customersAPI.delete(id);
			setCustomers((prev) => prev.filter((c) => c.id !== id));
			return true;
		} catch (err: any) {
			console.error("Error deleting customer:", err);
			throw err;
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
		page,
		limit,
		totalPages,
		total,
		fetchCustomers,
		setPage,
		setLimit,
		createCustomer,
		updateCustomer,
		deleteCustomer,
		getCustomerById,
	};
}
