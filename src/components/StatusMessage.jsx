export default function StatusMessage({ status, error }) {
    if (status === 'error') {
        return (
            <div className="status-msg status-error" role="alert">
                <span>❌</span>
                <span>{error}</span>
            </div>
        );
    }
    return null;
}