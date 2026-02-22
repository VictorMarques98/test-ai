import { toast } from "sonner";

/**
 * Success toast with green styling
 */
export const showSuccessToast = (message: string) => {
	toast.success(message, {
		unstyled: false,
		classNames: {
			toast: '!bg-green-50 !text-green-800 !border-green-200 dark:!bg-green-900 dark:!text-green-100 dark:!border-green-800 !border',
			title: '!text-green-800 dark:!text-green-100 !font-semibold',
			description: '!text-green-700 dark:!text-green-200',
			icon: '!text-green-600 dark:!text-green-400'
		}
	});
};

/**
 * Error toast with red styling
 */
export const showErrorToast = (message: string) => {
	toast.error(message, {
		unstyled: false,
		classNames: {
			toast: '!bg-red-50 !text-red-800 !border-red-200 dark:!bg-red-900 dark:!text-red-100 dark:!border-red-800 !border',
			title: '!text-red-800 dark:!text-red-100 !font-semibold',
			description: '!text-red-700 dark:!text-red-200',
			icon: '!text-red-600 dark:!text-red-400'
		}
	});
};

/**
 * Warning toast with yellow/amber styling
 */
export const showWarningToast = (message: string) => {
	toast.warning(message, {
		unstyled: false,
		classNames: {
			toast: '!bg-amber-50 !text-amber-800 !border-amber-200 dark:!bg-amber-900 dark:!text-amber-100 dark:!border-amber-800 !border',
			title: '!text-amber-800 dark:!text-amber-100 !font-semibold',
			description: '!text-amber-700 dark:!text-amber-200',
			icon: '!text-amber-600 dark:!text-amber-400'
		}
	});
};

/**
 * Info toast with blue styling
 */
export const showInfoToast = (message: string) => {
	toast.info(message, {
		unstyled: false,
		classNames: {
			toast: '!bg-blue-50 !text-blue-800 !border-blue-200 dark:!bg-blue-900 dark:!text-blue-100 dark:!border-blue-800 !border',
			title: '!text-blue-800 dark:!text-blue-100 !font-semibold',
			description: '!text-blue-700 dark:!text-blue-200',
			icon: '!text-blue-600 dark:!text-blue-400'
		}
	});
};
