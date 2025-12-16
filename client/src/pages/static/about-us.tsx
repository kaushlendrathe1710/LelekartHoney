import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Award,
  Users,
  ShoppingBag,
  TrendingUp,
  Globe,
  Truck,
  Smile,
  BadgeIndianRupee,
  ShieldCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

// Helper component to render content from footer management
const AboutPageSection = ({
  titleFilter,
  defaultContent,
  renderContent,
}: {
  titleFilter: string;
  defaultContent: React.ReactNode;
  renderContent?: (content: string) => React.ReactNode;
}) => {
  const { data: footerContents = [] } = useQuery({
    queryKey: ["/api/footer-content"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/footer-content");
      const data = await res.json();
      return data;
    },
  });

  // Find content with the specified section and title
  const contentItem = footerContents.find(
    (item: any) =>
      item.section === "about_page" &&
      item.title === titleFilter &&
      item.isActive
  );

  if (!contentItem) {
    return defaultContent;
  }

  // Render custom content if a renderer is provided, otherwise return the content as is
  return renderContent ? (
    renderContent(contentItem.content)
  ) : (
    <div dangerouslySetInnerHTML={{ __html: contentItem.content }} />
  );
};

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#F8F5E4] text-gray-800 py-4">
      <div className="container mx-auto px-4">
        {/* Main Content Area */}
        <div className="bg-[#F8F5E4] shadow-sm rounded-md overflow-hidden mb-6">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-6 md:p-8 lg:p-16">
            <div className="max-w-4xl mx-auto">
              <AboutPageSection
                titleFilter="Hero Title"
                defaultContent={
                  <>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                      About Papa Honey
                    </h1>
                    <p className="text-base md:text-lg lg:text-xl mb-4 md:mb-6">
                      Pure. Natural. Trusted.
                    </p>
                    <p className="text-sm md:text-base lg:text-lg opacity-90">
                      Papa Honey is a premium natural honey brand by Kaushal
                      Ranjeet Pvt. Ltd.
                    </p>
                  </>
                }
              />
            </div>
          </div>

          {/* Company Intro */}
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col lg:flex-row">
                <div className="w-full lg:pr-8 mb-6 lg:mb-0">
                  <AboutPageSection
                    titleFilter="Company Intro"
                    defaultContent={
                      <>
                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 text-[#2874f0]">
                          Papa Honey
                        </h2>

                        <p className="mb-3 md:mb-4 text-sm md:text-base text-gray-700">
                          Papa Honey is a premium natural honey brand operating
                          under
                          <span className="font-semibold">
                            {" "}
                            Kaushal Ranjeet Pvt. Ltd.
                          </span>
                          . The brand was founded with a clear vision to provide
                          pure, authentic, and unadulterated honey sourced
                          directly from trusted beekeepers across India.
                        </p>

                        <p className="mb-3 md:mb-4 text-sm md:text-base text-gray-700">
                          We follow strict quality control, ethical sourcing,
                          and hygienic processing practices to ensure that every
                          jar of Papa Honey preserves its natural taste,
                          nutrients, and health benefits. Each batch is
                          carefully tested before packaging to maintain the
                          highest standards of purity.
                        </p>

                        <p className="text-sm md:text-base text-gray-700">
                          Papa Honey stands for trust, wellness, and tradition.
                          Backed by Kaushal Ranjeet Pvt. Ltd., we are committed
                          to promoting natural living while supporting Indian
                          farmers and beekeeping communities through sustainable
                          practices.
                        </p>
                      </>
                    }
                  />
                </div>
              </div>

              {/* Core Values Section */}
              <div className="mt-8 md:mt-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
                  Our Core Values
                </h2>
                <AboutPageSection
                  titleFilter="Core Values"
                  defaultContent={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                      <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                        <CardContent className="p-4 md:p-5">
                          <div className="bg-[#2874f0]/10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full mb-3 md:mb-4">
                            <ShieldCheck
                              size={20}
                              className="text-[#2874f0] md:w-6 md:h-6"
                            />
                          </div>
                          <h3 className="text-base md:text-lg font-semibold mb-2">
                            Purity & Trust
                          </h3>
                          <p className="text-sm md:text-base text-gray-600">
                            We are committed to delivering 100% pure and natural
                            honey with complete transparency and honesty in
                            every step of our process.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                        <CardContent className="p-4 md:p-5">
                          <div className="bg-[#2874f0]/10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full mb-3 md:mb-4">
                            <TrendingUp
                              size={20}
                              className="text-[#2874f0] md:w-6 md:h-6"
                            />
                          </div>
                          <h3 className="text-base md:text-lg font-semibold mb-2">
                            Quality Excellence
                          </h3>
                          <p className="text-sm md:text-base text-gray-600">
                            From sourcing to packaging, we continuously improve
                            our standards to deliver consistent quality in every
                            jar.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-[#efefef] hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1 bg-transparent">
                        <CardContent className="p-4 md:p-5">
                          <div className="bg-[#2874f0]/10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full mb-3 md:mb-4">
                            <BadgeIndianRupee
                              size={20}
                              className="text-[#2874f0] md:w-6 md:h-6"
                            />
                          </div>
                          <h3 className="text-base md:text-lg font-semibold mb-2">
                            Fair Value
                          </h3>
                          <p className="text-sm md:text-base text-gray-600">
                            We believe in offering premium-quality honey at fair
                            and honest prices while supporting Indian
                            beekeepers.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  }
                />
              </div>

              {/* Leadership Section */}
              <div className="mt-8 md:mt-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
                  Leadership
                </h2>
                <AboutPageSection
                  titleFilter="Leadership Team"
                  defaultContent={
                    <div className="grid place-items-center gap-4 md:gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-blue-100 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-lg md:text-xl">
                            KK
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm md:text-base">
                          Kaushlender Kumar
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600">
                          Founder
                        </p>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-[#F8F5E4] shadow-sm rounded-md overflow-hidden mb-6 p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
              Frequently Asked Questions
            </h2>

            <AboutPageSection
              titleFilter="FAQs"
              defaultContent={
                <div className="space-y-3 md:space-y-4">
                  <div className="border border-gray-200 rounded-md">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer p-3 md:p-4">
                        <h3 className="font-medium text-sm md:text-base">
                          Is Papa Honey 100% natural?
                        </h3>
                        <span className="text-[#2874f0] font-bold group-open:rotate-180 transition-transform text-lg md:text-xl">
                          +
                        </span>
                      </summary>
                      <div className="p-3 md:p-4 pt-0 text-sm md:text-base text-gray-700">
                        Yes, Papa Honey is sourced directly from trusted
                        beekeepers and processed with strict quality checks to
                        ensure purity, authenticity, and natural goodness.
                      </div>
                    </details>
                  </div>

                  <div className="border border-gray-200 rounded-md">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer p-3 md:p-4">
                        <h3 className="font-medium text-sm md:text-base">
                          Do you offer returns or refunds?
                        </h3>
                        <span className="text-[#2874f0] font-bold group-open:rotate-180 transition-transform text-lg md:text-xl">
                          +
                        </span>
                      </summary>
                      <div className="p-3 md:p-4 pt-0 text-sm md:text-base text-gray-700">
                        No, we do not offer any return or refund policy. Due to
                        the nature of food products, all sales are final. Please
                        review product details carefully before placing an
                        order.
                      </div>
                    </details>
                  </div>

                  <div className="border border-gray-200 rounded-md">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer p-3 md:p-4">
                        <h3 className="font-medium text-sm md:text-base">
                          How can I become a distributor?
                        </h3>
                        <span className="text-[#2874f0] font-bold group-open:rotate-180 transition-transform text-lg md:text-xl">
                          +
                        </span>
                      </summary>
                      <div className="p-3 md:p-4 pt-0 text-sm md:text-base text-gray-700">
                        To become a distributor, click on the{" "}
                        <Link
                          to="become-a-distributor"
                          className="font-semibold text-[#2874f0] underline"
                        >
                          Become a Distributor
                        </Link>
                        {" "}link in the website footer and fill out the form with
                        correct details. Your application will be reviewed by
                        our admin team. If any details are found to be
                        incorrect, the application will be rejected.
                      </div>
                    </details>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
