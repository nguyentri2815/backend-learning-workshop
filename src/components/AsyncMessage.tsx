import styles from "./ui.module.css";

export function AsyncMessage({
  loading,
  error,
  retry,
  loadingText = "Đang xử lý mô phỏng…",
}: {
  loading: boolean;
  error: string;
  retry: () => void;
  loadingText?: string;
}) {
  if (loading)
    return (
      <div className={styles.loading} role="status">
        <span className={styles.spinner} /> {loadingText}
      </div>
    );
  if (error)
    return (
      <div className={styles.errorBox} role="alert">
        <p>{error}</p>
        <button className={styles.secondaryButton} onClick={retry}>
          Thử lại
        </button>
      </div>
    );
  return null;
}
