import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { identity } from '../site.js';

export default function NotFound() {
  return (
    <main id="main" className="page-loading">
      <div className="detail-missing">
        <p className="detail-code">404</p>
        <h1>Page not found</h1>
        <p>
          That link does not lead anywhere. Head back to {identity.firstName}&rsquo;s work.
        </p>
        <Link className="btn btn-primary" to="/">
          Back to home
          <Icon name="arrow" size={17} />
        </Link>
      </div>
    </main>
  );
}