export default function SearchBar({ value, onChange, status }) {
    return (
        <div className="search-wrapper">
            <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                    className="search-input"
                    type="text"
                    placeholder="Search a country..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoFocus
                    spellCheck={false}
                />
                {status === 'loading' && <span className="spinner" aria-label="Loading" />}
            </div>
        </div>
    );
}