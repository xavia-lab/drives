"use client";

// import dataProviderSimpleRest from "@refinedev/simple-rest";

// const API_URL = "https://api.fake-rest.refine.dev";
const API_URL = "http://localhost:5000/api/v1";

// export const dataProvider = dataProviderSimpleRest(API_URL);

export const dataProvider: DataProvider = {
  getOne: async ({ resource, id, meta }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`);

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },

  getMany: async ({ resource, ids, meta }) => {
    const params = new URLSearchParams();

    if (ids) {
      ids.forEach((id) => params.append("id", id));
    }

    const response = await fetch(`${API_URL}/${resource}?${params.toString()}`);

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },

  update: async ({ resource, id, variables, meta }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify(variables),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },

  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const params = new URLSearchParams();

    if (pagination) {
      params.append("pageNumber", pagination.current);
      params.append("pageSize", pagination.pageSize);
    }

    if (sorters && sorters.length > 0) {
      params.append(
        "sortField",
        sorters.map((sorter) => sorter.field).join(",")
      );
      params.append(
        "sortOrder",
        sorters.map((sorter) => sorter.order).join(",")
      );
    }

    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        if ("field" in filter && "operator" in filter) {
          params.append("filterField", filter.field);
          params.append("filterOperator", filter.operator);
          params.append("filterValue", filter.value);
        }
      });
    }

    const response = await fetch(`${API_URL}/${resource}?${params.toString()}`);

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    const total = Number(response.headers.get("x-pagination-total-count"));

    return {
      data,
      total: total,
    };
  },

  create: async ({ resource, variables }) => {
    const response = await fetch(`${API_URL}/${resource}`, {
      method: "POST",
      body: JSON.stringify(variables),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },

  deleteOne: async ({ resource, id, variables, meta }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      method: "DELETE",
    });

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },
  getApiUrl: () => API_URL,
  // Optional methods:
  // createMany: () => { /* ... */ },
  // deleteMany: () => { /* ... */ },
  // updateMany: () => { /* ... */ },
  // custom: () => { /* ... */ },
};
