"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "../../hooks/count/useAuth";
import * as accountService from "../../services/accountService";
import * as addressesService from "../../services/addressesService";
import { fetchMyOrders } from "../../services/ordersService";
import type {
  AccountCustomer,
  AccountOrder,
  AccountTab,
  Address,
  AddressInput,
  CustomerUpdate,
} from "@/src/types/account/account";

export function useAccount() {
  const router = useRouter();
  const { customer: authCustomer, loading: authLoading, logout: authLogout, refresh } = useAuth();

  const [customer, setCustomer] = useState<AccountCustomer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [tab, setTab] = useState<AccountTab>("pedidos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!authCustomer) {
      router.push("/login?redirect=/minha-conta");
      return;
    }

    let cancelled = false;

    (async () => {
      const [profile, addrs, myOrders] = await Promise.all([
        accountService.fetchProfile(),
        addressesService.fetchAddresses(),
        fetchMyOrders(),
      ]);

      if (cancelled) return;
      setCustomer(profile);
      setAddresses(addrs);
      setOrders(myOrders);
      setLoading(false);
    })().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, authCustomer, router]);

  const logout = async () => {
    await authLogout();
    router.push("/");
    router.refresh();
  };

  const saveProfile = async (data: CustomerUpdate) => {
    try {
      const updated = await accountService.updateProfile(data);
      setCustomer(updated);
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar os dados",
      );
      throw error;
    }
  };

  const reloadAddresses = async () => {
    setAddresses(await addressesService.fetchAddresses());
  };

  const addAddress = async (input: AddressInput) => {
    try {
      await addressesService.createAddress(input);
      await reloadAddresses();
      toast.success("Endereço adicionado!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar o endereço",
      );
    }
  };

  const editAddress = async (id: string, input: AddressInput) => {
    try {
      await addressesService.updateAddress(id, input);
      await reloadAddresses();
      toast.success("Endereço atualizado!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar o endereço",
      );
    }
  };

  const removeAddress = async (id: string) => {
    try {
      await addressesService.deleteAddress(id);
      await reloadAddresses();
      toast.success("Endereço excluído");
    } catch {
      toast.error("Não foi possível excluir o endereço");
    }
  };

  return {
    email: customer?.email ?? "",
    customer,
    addresses,
    orders,
    tab,
    setTab,
    loading,
    logout,
    saveProfile,
    addAddress,
    editAddress,
    removeAddress,
  };
}
