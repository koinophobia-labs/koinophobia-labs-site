import type { Metadata } from "next";
import About from "@/components/About";
import ClientTrust from "@/components/ClientTrust";
import Contact from "@/components/Contact";
import Concepts from "@/components/Concepts";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Nav from "@/components/Nav";
import ProductLab from "@/components/ProductLab";
import ProofOfWork from "@/components/ProofOfWork";
import Services from "@/components/Services";
import YouKnowBall from "@/components/YouKnowBall";
import TrendiFeature from "@/components/TrendiFeature";

export const metadata: Metadata = {
  alternates: { canonical: "https://koinophobialabs.com/" },
};

export default function Home() {
  return (
    <div className="blake-in-person-home">
      <div className="page-field" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <TrendiFeature />
        <YouKnowBall />
        <ProductLab />
        <ProofOfWork />
        <Concepts />
        <Services />
        <ClientTrust />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
