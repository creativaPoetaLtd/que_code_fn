// A wallet balance changed outside the component showing it (e.g. a top-up finished
// in a modal) - balance views listen and refetch.
const WALLET_UPDATED_EVENT = "qc:wallet-updated";

export const notifyWalletUpdated = (): void => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(WALLET_UPDATED_EVENT));
};

export const onWalletUpdated = (callback: () => void): (() => void) => {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(WALLET_UPDATED_EVENT, callback);
    return () => window.removeEventListener(WALLET_UPDATED_EVENT, callback);
};
