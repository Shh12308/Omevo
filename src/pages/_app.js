import "../index.css";
import "../pages/Video.module.css"; // move your global css here ONLY if needed

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
