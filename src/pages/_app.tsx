import 'tippy.js/dist/tippy.css'; // Keeping the tippy.js styles
import { AppProps } from 'next/app';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Add FullCalendar styles via CDN */}
        <link
          href="https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.8/index.global.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/@fullcalendar/resource-timegrid@6.1.8/index.global.min.css"
          rel="stylesheet"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
