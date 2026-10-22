import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    config => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (email: string, password: string) =>
        api.post("/auth/login", { email, password }),
    register: (name: string, email: string, password: string) =>
        api.post("/auth/register", { name, email, password }),
    me: () => api.get("/auth/isAuthenticated"),
    logout: () => api.post("/auth/logout"),
};

export const userApi = {
    getAll: () => api.get(`/user`),
    getById: (id: string) => api.get(`/user/${id}`),
    create: (data: any) => api.post(`/user`, data),
    update: (id: string, data: any) => api.put(`/user/${id}`, data),
    updateMainInfo: (id: string, data: any) => api.put(`/user/${id}/info`, data),
    updateBankInfo: (id: string, data: any) => api.put(`/user/${id}/bank`, data),
    updateDeposit: (id: string, data: any) => api.put(`/user/${id}/deposit`, data),
    delete: (id: string) => api.delete(`/user/${id}`),
};

export const projectApi = {
    getAll: () => api.get(`/project`),
    getById: (id: string) => api.get(`/project/${id}`),
    create: (data: any) => api.post(`/project`, data),
    update: (id: string, data: any) => api.put(`/project/${id}`, data),
    delete: (id: string) => api.delete(`/project/${id}`),
};

export const headerApi = {
    getAllByProject: (projectId: string) => api.get(`/budgetHeader?filter=${JSON.stringify({ project: projectId })}`),
    getById: (id: string) => api.get(`/budgetHeader/${id}`),
    create: (data: any) => api.post(`/budgetHeader`, data),
    update: (id: string, data: any) => api.put(`/budgetHeader/${id}`, data),
    delete: (id: string) => api.delete(`/budgetHeader/${id}`),
};

export const budgetApi = {
    getAllByProject: (projectId: string) => api.get(`/budget?filter=${JSON.stringify({ project: projectId })}`),
    getById: (id: string) => api.get(`/budget/${id}`),
    create: (data: any) => api.post(`/budget`, data),
    update: (id: string, data: any) => api.put(`/budget/${id}`, data),
    delete: (id: string) => api.delete(`/budget/${id}`),
    clone: (data: any) => api.post(`/budget/clone`, data),
    cloneToTransaction: (data: any) => api.post(`/budget/clonetotransaction`, data),
};

export const actualApi = {
    getAllByProject: (projectId: string) => api.get(`/actual?filter=${JSON.stringify({ project: projectId })}`),
    getById: (id: string) => api.get(`/actual/${id}`),
    create: (data: any) => api.post(`/actual`, data),
    update: (id: string, data: any) => api.put(`/actual/${id}`, data),
    delete: (id: string) => api.delete(`/actual/${id}`),
};