import { ScrollViewStyleReset } from "expo-router/html";
export default function Root({ children }) {
    return (<html lang="en">
      <head>
        <meta charSet="utf-8"/>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }}/>
      </head>
      <body>{children}</body>
    </html>);
}
const responsiveBackground = `
body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans",
    Helvetica, Arial, sans-serif;
}
`;
