import './Loader.css';

function Loader({ size = 'medium', color = 'white' }) {
  return (
    <div className={`loader loader--${size} loader--${color}`} role="status" aria-label="Loading">
      <div className="loader__spinner">
        <div className="loader__ring"></div>
        <div className="loader__ring"></div>
        <div className="loader__ring"></div>
      </div>
    </div>
  );
}

export default Loader;
