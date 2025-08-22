import React from "react";
import Header from "./Header";
import HeroSection from "./HeroSection";
import CardGrid from "./CardGrid";
import TripsTable from "./TripsTable";
import Footer from "./Footer";
import Section from "./Section";
import GenericSection from "./GenericSection";

const COMPONENT_MAP = {
  header: Header,
  hero: HeroSection,
  herosection: HeroSection,
  cardgrid: CardGrid,
  tripstable: TripsTable,
  footer: Footer,
  section: Section,
};

export default function LayoutRenderer({ layoutSections = [] }) {
  if (!Array.isArray(layoutSections) || layoutSections.length === 0) {
    return <div className="text-gray-400 text-center py-8">No layout to display.</div>;
  }
  return (
    <div className="space-y-8">
      {layoutSections.map((section, idx) => {
        const typeKey = section.type ? section.type.toLowerCase() : '';
        const SectionComponent = COMPONENT_MAP[typeKey];
        if (!SectionComponent) {
          return (
            <GenericSection key={idx} type={section.type} {...(section.props || {})} />
          );
        }
        return <SectionComponent key={idx} {...(section.props || {})} />;
      })}
    </div>
  );
} 