import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import type {
  RiderWalletCashOutRequest,
  RiderWalletCashOutResubmitRequest,
  RiderWalletCashOutResponse,
  RiderWalletEnvelope,
  RiderWalletTransactionsPage,
} from "@/core/rider-wallet";

export type {
  RiderWalletCashOutRequest as WalletCashOutRequest,
  RiderWalletCashOutResubmitRequest as WalletCashOutResubmitRequest,
  RiderWalletCashOutResponse as WalletCashOutResponse,
  RiderWalletTransactionItem as WalletTransactionItem,
  RiderWalletTransactionsPage as WalletTransactionsResponse,
  RiderWalletTransactionsParams as WalletTransactionsParams,
} from "@/core/rider-wallet";

/** One page in the infinite query; default driver implementation uses this. */
export type DefaultWalletQueryPage =
  RiderWalletEnvelope<RiderWalletTransactionsPage>;

type TransactionsQueryShape<TData> = Pick<
  UseInfiniteQueryResult<TData, unknown>,
  | "data"
  | "error"
  | "isError"
  | "isLoading"
  | "refetch"
  | "hasNextPage"
  | "isFetchingNextPage"
  | "fetchNextPage"
>;

/**
 * Generic wallet data layer: inject any React Query infinite list + two mutations
 * (e.g. a different org’s endpoints while reusing the same `Wallet` UI).
 */
export type WalletApi<TQueryData = DefaultWalletQueryPage> = {
  transactionsQuery: TransactionsQueryShape<TQueryData>;
  cashOut: {
    mutateAsync: (
      variables: RiderWalletCashOutRequest
    ) => Promise<RiderWalletCashOutResponse>;
  };
  cashOutResubmit: {
    mutateAsync: (
      variables: RiderWalletCashOutResubmitRequest
    ) => Promise<RiderWalletCashOutResponse>;
  };
};
