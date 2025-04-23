import Header from "./Header";

export default function Layout(props) {
  return (
    <div class="flex min-h-screen flex-col">
      <Header />
      <main class="flex-1 mx-2">{props.children}</main>
      <footer class="bg-background py-6 text-center text-sm text-muted-foreground">
        <div class="container">
          <p>
            © {new Date().getFullYear()} Off Season Ultimate. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
