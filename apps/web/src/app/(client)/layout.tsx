import { HeaderNavigation } from "@/components/HeaderNavigation";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const navigation = {
    primaryAction: "Sign In",
    secondaryAction: "Partner",
  };

  return (
    <>
      <HeaderNavigation brandName="BookYourStay" navigation={navigation} />
      <div>{children}</div>
    </>
  );
}
