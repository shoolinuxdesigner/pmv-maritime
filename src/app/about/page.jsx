"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import SubBanner from "@/components/Sub Banner/page";
import SubHeading from "@/design/sub-heading/page";
import Projects from "@/components/Projects Section/page";

// Images
import image1 from "../../../public/assets/images/about-image-1.jpg";
import image2 from "../../../public/assets/images/about-image-2.jpg";
import image3 from "../../../public/assets/images/about-image-3.jpg";

// Members
import member1 from "../../../public/assets/members/member1.png";
import member2 from "../../../public/assets/members/member2.png";
import member3 from "../../../public/assets/members/member3.png";
import member4 from "../../../public/assets/members/member4.png";
import member5 from "../../../public/assets/members/member5.png";
import newMember1 from "../../../public/assets/members/new-member-1.png";
import newMember2 from "../../../public/assets/members/new-member-2.png";
import newMember3 from "../../../public/assets/members/new-member-3.png";
import newMember4 from "../../../public/assets/members/new-member-4.png";
import newMember5 from "../../../public/assets/members/new-member-5.png";
import newMember6 from "../../../public/assets/members/new-member-6.png";
import newMember7 from "../../../public/assets/members/new-member-7.png";
import newMember8 from "../../../public/assets/members/new-member-8.png";
import newMember9 from "../../../public/assets/members/new-member-9.png";

const directionImages = [image1, image2, image3];

// icons
import { FaLinkedinIn, FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { BsGlobe2 } from "react-icons/bs";
import { GrInstagram } from "react-icons/gr";
import { MdOutlineEmail } from "react-icons/md";
import { FaXTwitter } from "react-icons/fa6";
import { FaArrowRight } from "react-icons/fa";
import { X } from "lucide-react";
import Accreditation from "@/components/Accreditation/page";
import GallerySection from "@/components/GallerySection/page";
import ContactUs from "@/components/Contact Us/page";

const teamMembers = [
  // {
  //   name: "Dr Ade Dosunmu, MON",
  //   role: "Director",
  //   image: member1,
  //   description: "Dr Ade Dosunmu is an accomplished maritime administrator, public policy expert and academic with extensive experience in maritime governance, public administration and institutional leadership. A former Director-General/Chief Executive Officer of NIMASA, he has represented Nigeria at international maritime and labour forums, including the IMO and ILO. With a doctorate in Public Administration and extensive executive-level experience, he brings a strong combination of maritime knowledge, policy expertise and strategic leadership to the organisation.",
  //   expertise: [
  //     "Maritime Administration & Governance",
  //     "Maritime Policy & Regulatory Affairs",
  //     "Public Policy & Administration",
  //     "Strategic Leadership & Institutional Development",
  //     "Corporate Governance & Administration",
  //     "International Maritime Relations",
  //     "Government & Stakeholder Relations",
  //     "Shipping, Transport & Logistics"
  //   ],
  //   socials: {
  //     email: "info@pmvmaritime.com",
  //     linkedin: "https://www.linkedin.com/in/dr-ade-dosunmu-234977131",
  //     x: "https://x.com/dradedosunmu23"
  //   }
  // },
  // {
  //   name: "Capt. Gaurav Chhabra",
  //   role: "Global Head - Maritime Strategy & Innovation",
  //   image: member2,
  //   description: "Capt. Gaurav Chhabra is a Master Mariner with over 20 years of global maritime experience spanning seagoing operations, maritime training, simulation, business development and digital innovation. His career combines practical shipboard experience with shore-based leadership and technology-driven maritime education. With a strong focus on operational excellence, training development and innovation, he brings practical maritime knowledge and a forward-looking approach to developing effective solutions for the evolving needs of the maritime industry.",
  //   expertise: [
  //     "Maritime Operations",
  //     "Maritime Training & Simulation",
  //     "Digital Innovation & Transformation",
  //     "Business Development",
  //     "Strategic Leadership",
  //     "Maritime Education & Training Development",
  //     "Technology-Enabled Learning",
  //     "Sea-to-Shore Operations"
  //   ],
  //   socials: {
  //     email: "info@pmvmaritime.com",
  //     linkedin: "https://www.linkedin.com/in/gaurav-chhabra-658948213",
  //   }
  // },
  // {
  //   name: "Capt. Duryodhan Tarai",
  //   role: "Global Head of Offshore & Marine Operations",
  //   image: member3,
  //   description: "Capt. Duryodhan Tarai is an experienced maritime professional with extensive expertise in offshore operations, vessel management and marine assurance. His career includes command of Dive Support Vessels (DSVs) as Master, followed by senior shore-based assignments with ADNOC Offshore and Saudi Aramco. His experience encompasses complex offshore operations, Dynamic Positioning (DP) trials, vessel inspections, marine and offshore surveys, Marine Warranty Surveys, project risk assessment and regulatory compliance. He brings a strong combination of practical command experience, technical expertise and operational leadership to the organisation.",
  //   expertise: [
  //     "Offshore & Marine Operations",
  //     "Vessel Management & Operations",
  //     "Dynamic Positioning (DP) Operations & Trials",
  //     "Dive Support Vessel (DSV) Operations",
  //     "Marine & Offshore Surveys",
  //     "Marine Warranty Surveys",
  //     "Vessel Inspection & Compliance",
  //     "Offshore Project Execution & Risk Assessment",
  //     "Marine Safety & Operational Assurance"
  //   ],
  //   socials: {
  //     email: "info@pmvmaritime.com",
  //     linkedin: "https://www.linkedin.com/in/capt-duryodhan-tarai-18205068",
  //   }
  // },
  // {
  //   name: "Mr. Saswat Ranjan Barik",
  //   role: "Head - Marine Personnel & Commercial Operations, Nigeria",
  //   image: member4,
  //   description: "Mr. Saswat Ranjan Barik is an experienced maritime professional, Master Mariner and certified Lead Auditor with nearly two decades of experience across marine operations, crew management, regulatory compliance, quality assurance, maritime training and commercial operations. His experience combines practical seagoing knowledge with shore-based leadership in India and Nigeria. With expertise in international maritime regulations and quality management systems, he leads marine personnel and commercial operations while supporting regulatory compliance, operational excellence and sustainable business growth within the organisation.",
  //   expertise: [
  //     "Marine Personnel & Crew Management",
  //     "Commercial & Marine Operations",
  //     "Maritime Regulatory Compliance",
  //     "ISO 9001 & ISO 17025 Quality Management Systems",
  //     "Maritime Audits & Inspections",
  //     "STCW & MLC 2006 Compliance",
  //     "ISM, ISPS & MARPOL Compliance",
  //     "Maritime Training & Accreditation",
  //     "Port & Marine Operations",
  //     "Business Development & Operational Strategy"
  //   ],
  //   socials: {
  //     email: "saswat@pmvmaritime.com"
  //   }
  // },
  // {
  //   name: "Capt. Iftikhar Khan",
  //   role: "Maritime Security & Commercial Operations - UK",
  //   image: member5,
  //   description: "Capt. Iftikhar Khan is an accomplished maritime professional and Master Mariner with extensive international experience across ship operations, commercial shipping, maritime security and business development. Combining a strong seafaring background with senior shore-based leadership, his expertise spans voyage management, marine operations, security and risk management, commercial development and maritime education. His operational knowledge and leadership experience support the organisation's commitment to safe, secure and efficient maritime services and sustainable business growth.",
  //   expertise: [
  //     "Maritime Security & Risk Management",
  //     "Commercial Shipping Operations",
  //     "Ship & Marine Operations",
  //     "Voyage Management",
  //     "Business Development",
  //     "Maritime Safety & Operational Management",
  //     "Maritime Education",
  //     "Strategic Leadership"
  //   ],
  //   socials: {
  //     email: "info@pmvmaritime.com"
  //   }
  // },
  {
    name: "Dr Ade Dosunmu, MON",
    role: "Director",
    image: newMember1,
    description:
      "Dr Ade Dosunmu is an accomplished maritime administrator, public policy expert and academic with extensive experience in maritime governance, public administration and institutional leadership. A former Director-General/Chief Executive Officer of NIMASA, he has represented Nigeria at international maritime and labour forums, including the IMO and ILO. With a doctorate in Public Administration and extensive executive-level experience, he brings a strong combination of maritime knowledge, policy expertise and strategic leadership to the organisation.",
    expertise: [
      "Maritime Administration & Governance",
      "Maritime Policy & Regulatory Affairs",
      "Public Policy & Administration",
      "Strategic Leadership & Institutional Development",
      "Corporate Governance & Administration",
      "International Maritime Relations",
      "Government & Stakeholder Relations",
      "Shipping, Transport & Logistics",
    ],
    socials: {
      linkedin: "https://www.linkedin.com/in/dr-ade-dosunmu-234977131",
      x: "https://x.com/dradedosunmu23"
    },
  },
  {
    name: "Capt. Gaurav Chhabra",
    role: "Global Head - Maritime Strategy & Innovation",
    image: newMember2,
    description:
      "Capt. Gaurav Chhabra is a Master Mariner with over 20 years of global maritime experience spanning seagoing operations, maritime training, simulation, business development and digital innovation. His career combines practical shipboard experience with shore-based leadership and technology-driven maritime education. With a strong focus on operational excellence, training development and innovation, he brings practical maritime knowledge and a forward-looking approach to developing effective solutions for the evolving needs of the maritime industry.",
    expertise: [
      "Maritime Operations",
      "Maritime Training & Simulation",
      "Digital Innovation & Transformation",
      "Business Development",
      "Strategic Leadership",
      "Maritime Education & Training Development",
      "Technology-Enabled Learning",
      "Sea-to-Shore Operations",
    ],
    socials: {
      email: "info@pmvmaritime.com",
      linkedin: "https://www.linkedin.com/in/gaurav-chhabra-658948213",
    },
  },
  {
    name: "Capt. Duryodhan Tarai",
    role: "Global Head of Offshore & Marine Operations",
    image: newMember3,
    description:
      "Capt. Duryodhan Tarai is an experienced maritime professional with extensive expertise in offshore operations, vessel management and marine assurance. His career includes command of Dive Support Vessels (DSVs) as Master, followed by senior shore-based assignments with ADNOC Offshore and Saudi Aramco. His experience encompasses complex offshore operations, Dynamic Positioning (DP) trials, vessel inspections, marine and offshore surveys, Marine Warranty Surveys, project risk assessment and regulatory compliance. He brings a strong combination of practical command experience, technical expertise and operational leadership to the organisation.",
    expertise: [
      "Offshore & Marine Operations",
      "Vessel Management & Operations",
      "Dynamic Positioning (DP) Operations & Trials",
      "Dive Support Vessel (DSV) Operations",
      "Marine & Offshore Surveys",
      "Marine Warranty Surveys",
      "Vessel Inspection & Compliance",
      "Offshore Project Execution & Risk Assessment",
      "Marine Safety & Operational Assurance",
    ],
    socials: {
      email: "info@pmvmaritime.com",
      linkedin: "https://www.linkedin.com/in/capt-duryodhan-tarai-18205068",
    },
  },
  {
    name: "Mr. Saswat Ranjan Barik",
    role: "Head - Marine Personnel & Commercial Operations, Nigeria",
    image: newMember4,
    description:
      "Mr. Saswat Ranjan Barik is an experienced maritime professional, Master Mariner and certified Lead Auditor with nearly two decades of experience across marine operations, crew management, regulatory compliance, quality assurance, maritime training and commercial operations. His experience combines practical seagoing knowledge with shore-based leadership in India and Nigeria. With expertise in international maritime regulations and quality management systems, he leads marine personnel and commercial operations while supporting regulatory compliance, operational excellence and sustainable business growth within the organisation.",
    expertise: [
      "Marine Personnel & Crew Management",
      "Commercial & Marine Operations",
      "Maritime Regulatory Compliance",
      "ISO 9001 & ISO 17025 Quality Management Systems",
      "Maritime Audits & Inspections",
      "STCW & MLC 2006 Compliance",
      "ISM, ISPS & MARPOL Compliance",
      "Maritime Training & Accreditation",
      "Port & Marine Operations",
      "Business Development & Operational Strategy",
    ],
    socials: {
      email: "saswat@pmvmaritime.com",
    },
  },
  {
    name: "Capt. Iftikhar Khan",
    role: "Maritime Security & Commercial Operations - UK",
    image: newMember5,
    description:
      "Capt. Iftikhar Khan is an accomplished maritime professional and Master Mariner with extensive international experience across ship operations, commercial shipping, maritime security and business development. Combining a strong seafaring background with senior shore-based leadership, his expertise spans voyage management, marine operations, security and risk management, commercial development and maritime education. His operational knowledge and leadership experience support the organisation's commitment to safe, secure and efficient maritime services and sustainable business growth.",
    expertise: [
      "Maritime Security & Risk Management",
      "Commercial Shipping Operations",
      "Ship & Marine Operations",
      "Voyage Management",
      "Business Development",
      "Maritime Safety & Operational Management",
      "Maritime Education",
      "Strategic Leadership",
    ],
    socials: {
      email: "info@pmvmaritime.com",
    },
  },
  {
    name: "Okeowo Uthman Olorunfemi",
    role: "Simulator Manager & Technical Head",
    image: newMember6,
    description:
      "Okeowo Uthman Olorunfemi is an experienced maritime simulation and technical professional responsible for the operation, maintenance, installation and continuous improvement of training simulator systems. As Simulator Manager & Technical Head at PMV Maritime Solutions, he also leads the technical functions covering IT, power systems and networking. Certified across the organisation's simulator platforms, he has received technical training from leading maritime simulation technology providers, including Wärtsilä Voyage, ARI Simulation and MEVEA Simulation. Combining specialised technical training with extensive hands-on experience, he plays a key role in maintaining reliable, efficient and high-quality simulation and technology infrastructure for maritime training.",
    expertise: [
      "Maritime Simulation Systems",
      "Simulator Installation, Operation & Maintenance",
      "Simulator System Integration",
      "IT Infrastructure & Technical Support",
      "Networking & Systems Management",
      "Power Systems & Technical Operations",
      "Preventive Maintenance & Troubleshooting",
      "Technical Training & System Support",
    ],
    socials: {
      email: "info@pmvmaritime.com",
    },
  },
  {
    name: "Anjolaoluwa Odukoya",
    role: "Human Resources & Organisational Development",
    image: newMember7,
    description:
      "Anjolaoluwa Odukoya is a Human Resources professional with expertise in HR management, talent acquisition, employee relations and organisational development. A graduate of Industrial Relations and Human Resources Management from Covenant University, Anjolaoluwa brings a people-focused approach to developing HR strategies, strengthening employee engagement and supporting workforce effectiveness and organisational growth.",
    expertise: [
      "Human Resources Management",
      "Talent Acquisition & Recruitment",
      "Employee Relations",
      "Organisational Development",
      "Performance & Workforce Management",
      "People Management Strategies",
      "Employee Engagement",
      "HR Policy & Administration",
    ],
    socials: {
      email: "info@pmvmaritime.com",
    },
  },
  {
    name: "Chief Engr. Patrick Lumumba Dery",
    role: "Principal - Lagos Maritime Academy | Technical Advisor",
    image: newMember8,
    description:
      "Chief Engr. Patrick Lumumba Dery is a distinguished marine engineer, maritime educator and technical leader with over 30 years of international experience across marine engineering, offshore operations, maritime safety, regulatory compliance and training. A Class I Marine Engineer (Unlimited), he has served as Chief Marine Engineer with Tidewater Marine International, Marine Surveyor with the Ghana Maritime Authority and Acting Chief Examiner. His background includes competency assessments, offshore vessel operations, Dynamic Positioning (DP) systems, drydock management and marine inspections. As Principal of Lagos Maritime Academy, he provides academic and technical leadership in curriculum delivery, cadet training and quality assurance. As Technical Advisor to PMV Maritime Solutions, he supports the organisation's technical activities, marine operations, safety and compliance.",
    expertise: [
      "Marine Engineering & Technical Operations",
      "Maritime Education & Training",
      "Technical Advisory & Marine Services",
      "IMO & STCW Regulatory Compliance",
      "Marine Engineering Competency Assessment",
      "Offshore Vessel Operations",
      "Dynamic Positioning (DP) Systems",
      "Ship Maintenance & Drydock Management",
      "Marine Surveys & Inspections",
      "Maritime Safety & Quality Assurance",
      "Academic & Technical Leadership",
    ],
    socials: {
      email: "info@pmvmaritime.com",
    },
  },
  {
    name: "Chief Engr. Theodore Ebenezer Kudjoe Mensah",
    role: "Head of Marine Engineering & Technical Services",
    image: newMember9,
    description:
      "Chief Engr. Theodore Ebenezer Kudjoe Mensah is an accomplished marine engineering professional and maritime educator with extensive international experience across shipboard engineering, shipbuilding, technical management and maritime education. A Class I Marine Engineer (Unlimited), he brings approximately 19 years of active seagoing experience, including service as Chief Engineer. His professional background also includes significant technical and shipbuilding experience, including the supervision of the construction of 31 offshore support vessels. He has further contributed to professional maritime development as a lecturer at Regional Maritime University, Ghana, and as a Certificate of Competency Assessor with the Ghana Maritime Authority. As Head of Marine Engineering & Technical Services at Lagos Maritime Academy, Chief Engr. Mensah provides academic and technical leadership for marine engineering training while supporting the Academy's technical activities. His experience in marine engineering, shipbuilding and technical management enables him to strengthen practical training, technical standards, equipment-related activities and industry-aligned professional development. His combination of seagoing experience, engineering leadership, shipbuilding expertise and maritime education supports the Academy's commitment to developing technically competent, safety-conscious and internationally competitive maritime professionals.",
    expertise: [
      "Marine Engineering & Technical Services",
      "Shipboard Engineering & Operations",
      "Shipbuilding & New-Build Supervision",
      "Technical Management",
      "Offshore Support Vessels",
      "Marine Engineering Education & Training",
      "Certificate of Competency Assessment",
      "Ship Maintenance & Engineering Systems",
      "Maritime Safety & Regulatory Compliance",
      "Practical Training & Technical Mentorship",
    ],
    socials: {
      email: "info@pmvmaritime.com",
    },
  },
];

export default function About() {
  const [activeTab, setActiveTab] = useState("mission");
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (member) => {
    setSelectedMember(member);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSelectedMember(null);
    }, 300);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && modalOpen) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  const tabContents = {
    mission:
      "Our mission is to deliver integrated maritime solutions that improve safety, operational efficiency, compliance, and sustainability across the global maritime industry. By combining maritime expertise, digital innovation, and strong industry partnerships, we provide practical, reliable, and future-ready solutions for shipowners, ports, maritime institutions, and industry stakeholders.",

    vision:
      "Our vision is to become a globally trusted maritime solutions partner, connecting expertise, technology, people, and infrastructure to build safer, smarter, and more sustainable maritime operations. We strive to create long-term value through innovation, workforce development, and responsible project execution.",

    goals:
      "Deliver integrated maritime solutions across consultancy, training, fleet management, crew management, port operations, digitisation, shipbuilding, environmental protection, recruitment, education, and maritime projects while driving innovation, operational excellence, sustainability, and long-term industry growth."
  };

  return (
    <>
      <SubBanner Heading="About Us" breadcrumbItems={[{ label: "About Us", href: "/about" }]} />
      <div className="flex flex-col md:flex-row container max-w-7xl mx-auto items-stretch relative border border-t-0 border-gray-200 bg-[#f7f5f8]">
        <div className="flex flex-col md:flex-row">
          <div className="flex flex-col w-full py-6 md:py-4 md:w-7/12 px-4 md:px-8 my-auto">
            <h1 className="font-oswald text-4xl md:text-5xl text-secondary font-bold mb-3 md:mb-6">Beyond the Horizon<span className="text-primary">,</span><br /><span className="text-secondary-dark">Leading with Trust</span><span className="text-primary">.</span></h1>
            <p className="text-sm md:text-[15px] max-w-full md:max-w-[80%] text-gray-600 font-medium">PMV Maritime is a global maritime leader with 20+ years of experience in port operations, fleet management, and logistics consultancy. We combine technical precision with visionary management to curate the flow of global commerce with a commitment to sustainability and digital-first operations.</p>
          </div>
          <div className="hidden w-full md:w-5/12 md:flex h-auto flex-col mt-6 md:mt-0">
            <video src="/video/about-video.mp4" autoPlay loop muted playsInline></video>
          </div>
        </div>
      </div >

      <div className="container max-w-7xl mx-auto border border-t-0 border-gray-200 bg-white relative">
        <div className="flex flex-col md:flex-row py-8 px-4 md:px-8 gap-8 md:gap-12 items-stretch">
          {/* Left Column: Image Slider Container */}
          <div className="w-full md:w-1/2 min-h-[300px] md:min-h-[300px] relative overflow-hidden shadow-md group/img">
            {directionImages.map((img, idx) => (
              <Image
                key={idx}
                src={img}
                alt={`Our Direction ${idx + 1}`}
                fill
                className={`object-cover transition-all duration-1000 ease-in-out group-hover/img:scale-105 ${idx === currentImageIdx ? "opacity-100 z-1" : "opacity-0 z-0"
                  }`}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={idx === 0}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-2"></div>

            {/* Pagination Dots Pill */}
            <div className="absolute bottom-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xs z-10">
              {directionImages.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setCurrentImageIdx(dotIdx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${currentImageIdx === dotIdx ? "w-6 bg-primary" : "w-2 bg-white/70 hover:bg-white"
                    }`}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Direction Tabs */}
          <div className="w-full md:w-1/2 flex flex-col justify-center pb-0 pt-4 md:pb-4">
            <SubHeading title="Our Direction" className="mb-2 md:mb-3" />

            {/* Headline */}
            <h2 className="font-oswald text-3xl sm:text-3xl md:text-[42px] text-secondary font-bold mb-8 leading-tight">
              What Drives Us <span className="text-secondary-dark">Forward</span>
            </h2>

            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 mb-4 gap-6 md:gap-10">
              {["Mission", "Vision", "Goals"].map((tab) => {
                const tabId = tab.toLowerCase();
                const isActive = activeTab === tabId;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tabId)}
                    className={`pb-2.5 text-base md:text-lg font-bold tracking-wide uppercase transition-all duration-300 relative -mb-[2px] ${isActive
                      ? "text-primary border-b-2 border-primary font-bold"
                      : "text-gray-500 border-b-2 border-transparent hover:text-secondary-dark font-medium"
                      }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="min-h-[150px] md:min-h-[160px]">
              <p className="text-sm md:text-[16px] text-gray-600 font-medium leading-relaxed">
                {tabContents[activeTab]}
              </p>
            </div>
          </div>
        </div>
      </div>
      <Projects />
      <div className="container max-w-7xl mx-auto border border-t-0 border-gray-200 bg-white relative" id="team">
        <div className="flex flex-col md:flex-row w-full gap-3 md:gap-0 py-8 px-4 md:px-8">
          <div className="flex flex-col w-full">
            <SubHeading title="Our Team" className="mb-4 md:mb-6" />
            <h1 className="font-oswald text-2xl md:text-4xl text-secondary font-bold mb-3 md:mb-6">Meet the <span className="text-secondary-dark">People</span> Behind <span className="text-secondary-dark">PMV Maritime</span><span className="text-primary">.</span><br /></h1>
            <p className="text-sm md:text-[15px] max-w-full md:max-w-[60%] text-gray-600 font-medium">Our leadership team combines maritime expertise with digital innovation to drive excellence across every operation.</p>
          </div>
          <Link
            href="#"
            className="hidden mt-auto whitespace-nowrap mr-auto md:mr-0 ml-0 md:ml-auto group w-fit text-md gap-5 items-center mb-3 pl-3 md:pl-4 pr-2 md:pr-3 py-1.5 md:py-2 bg-white border-secondary text-secondary border hover:border-secondary-hover hover:text-secondary-hover font-bold transition-all duration-300"
          >
            All Members <FaArrowRight className="group-hover:-rotate-45 transition-all duration-300 ease-in-out" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-gray-200 gap-px border-t border-gray-200">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              onClick={() => openModal(member)}
              className="flex flex-col gap-2 p-4 md:px-8 md:pb-4 md:pt-6 bg-white group cursor-pointer transition-all duration-300 relative"
            >
              <div className="min-h-[200px] relative bg-gradient-to-t from-neutral-200 via-transparent to-neutral-300 overflow-hidden">
                <div className="h-[10px] w-[1000px] bg-secondary -rotate-43 absolute -bottom-64 -right-40 z-10 group-hover:h-[200px] group-hover:translate-29 transition-all linear duration-500"></div>
                <div className="h-[20px] w-[1000px] bg-primary -rotate-43 absolute -bottom-58 -right-40 z-10 group-hover:h-[1000px] group-hover:-translate-24 transition-all linear duration-500"></div>
                <Image src={member.image} alt={member.name} className="h-full object-contain object-bottom relative z-10" fill />
              </div>
              <div className="flex flex-col gap-1 h-full">
                <h3 className="text-xl font-bold font-oswald text-gray-900 group-hover:text-primary transition-colors duration-300">{member.name}</h3>
                <p className="text-[13px] text-secondary uppercase font-semibold mb-1">{member.role}</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div className="flex flex-wrap flex-row gap-1 md:gap-2" onClick={(e) => e.stopPropagation()}>
                    {member.socials.email && (
                      <a href={`mailto:${member.socials.email}`} target="_blank" className="bg-primary/7 hover:bg-primary transition-all duration-300 hover:text-white p-1.5 text-primary">
                        <MdOutlineEmail className="scale-120" />
                      </a>
                    )}
                    {member.socials.linkedin && (
                      <a href={member.socials.linkedin} target="_blank" className="bg-primary/7 hover:bg-[#0077b5] transition-all duration-300 hover:text-white p-1.5 text-primary">
                        <FaLinkedinIn />
                      </a>
                    )}
                    {member.socials.x && (
                      <a href={member.socials.x} target="_blank" className="bg-primary/7 hover:bg-black transition-all duration-300 hover:text-white p-1.5 text-primary">
                        <FaXTwitter />
                      </a>
                    )}
                    {member.socials.facebook && (
                      <a href={member.socials.facebook} target="_blank" className="bg-primary/7 hover:bg-[#1877f2] transition-all duration-300 hover:text-white p-1.5 text-primary">
                        <FaFacebookF />
                      </a>
                    )}
                    {member.socials.instagram && (
                      <a href={member.socials.instagram} target="_blank" className="bg-primary/7 hover:bg-gradient-to-tr hover:from-[#e28827] hover:via-[#d41d39] hover:to-[#aa0c78] transition-all duration-300 hover:text-white p-1.5 text-primary">
                        <GrInstagram />
                      </a>
                    )}
                    {member.socials.whatsapp && (
                      <a href={member.socials.whatsapp} target="_blank" className="bg-primary/7 hover:bg-[#0ea545] transition-all duration-300 hover:text-white p-1.5 text-primary">
                        <FaWhatsapp />
                      </a>
                    )}
                    {member.socials.website && (
                      <a href={member.socials.website} target="_blank" className="bg-primary/7 hover:bg-primary transition-all duration-300 hover:text-white p-1.5 text-primary">
                        <BsGlobe2 />
                      </a>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:-rotate-45 transition-transform duration-300">
                    <FaArrowRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Accreditation />
      <GallerySection />
      <ContactUs />

      {/* Team Member Details Modal */}
      {(modalOpen || selectedMember) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div
            onClick={closeModal}
            className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${modalOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
          />

          {/* Modal Box */}
          <div
            className={`relative w-full max-w-5xl bg-white rounded-none shadow-2xl overflow-hidden z-10 transform transition-all duration-300 my-auto ${modalOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-3.5 right-10.5 z-30 p-2 rounded-none bg-white/90 hover:bg-primary text-gray-700 hover:text-white border border-gray-200/80 hover:border-primary transition-all duration-200 cursor-pointer shadow-sm"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Modal Content Row */}
            {selectedMember && (
              <div className="flex flex-col md:flex-row max-h-[88vh] md:max-h-[580px] overflow-y-auto md:overflow-hidden">
                {/* Left Side: Executive Portrait & Direct Contact Panel */}
                <div className="w-full md:w-[330px] lg:w-[360px] bg-slate-50 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col shrink-0">
                  {/* Portrait Showcase with Seamless Bottom Dissolve */}
                  <div className="relative h-[220px] sm:h-[240px] md:h-[270px] bg-gradient-to-b from-slate-200 via-neutral-100 to-slate-50 flex items-end justify-center overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(0,123,167,0.14),transparent_70%)] pointer-events-none" />

                    {/* Cutout Image */}
                    <div className="relative w-full h-full flex items-end justify-center px-4">
                      <Image
                        src={selectedMember.image}
                        alt={selectedMember.name}
                        className="h-[95%] scale-108 sm:-translate-y-4 w-auto max-w-full object-contain object-bottom relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
                        priority
                      />
                    </div>

                    {/* Smooth Bottom Dissolve Gradient (Eliminates the harsh torso cutoff line) */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent z-15 pointer-events-none" />
                  </div>

                  {/* Left Bottom: Contact Options & Executive Affiliation */}
                  <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                    <div>
                      <div className="mb-5 pr-8">
                        <h3 className="text-xl sm:text-2xl lg:text-[28px] font-bold font-oswald text-gray-900 leading-tight mb-3">
                          {selectedMember.name}
                        </h3>
                        <span className="inline-block px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-secondary-dark bg-secondary/10 border-l-2 border-secondary mb-0 sm:mb-2">
                          {selectedMember.role}
                        </span>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2">
                        {selectedMember.socials.email && (
                          <a
                            href={`mailto:${selectedMember.socials.email}`}
                            className="flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2 sm:px-3 sm:py-2 bg-white hover:bg-primary hover:text-white text-gray-700 text-xs font-semibold border border-gray-200/90 hover:border-primary transition-all duration-200 group shadow-2xs"
                            title={selectedMember.socials.email}
                          >
                            <MdOutlineEmail className="text-primary group-hover:text-white text-base shrink-0 transition-colors" />
                            <span className="hidden sm:inline">{selectedMember.socials.email}</span>
                          </a>
                        )}
                        {selectedMember.socials.linkedin && (
                          <a
                            href={selectedMember.socials.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2 sm:px-3 sm:py-2 bg-white hover:bg-[#0077b5] hover:text-white text-gray-700 text-xs font-semibold border border-gray-200/90 hover:border-[#0077b5] transition-all duration-200 group shadow-2xs"
                            title="LinkedIn"
                          >
                            <FaLinkedinIn className="text-[#0077b5] group-hover:text-white text-sm shrink-0 transition-colors" />
                            <span className="hidden sm:inline">LinkedIn</span>
                          </a>
                        )}
                        {selectedMember.socials.x && (
                          <a
                            href={selectedMember.socials.x}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2 sm:px-3 sm:py-2 bg-white hover:bg-black hover:text-white text-gray-700 text-xs font-semibold border border-gray-200/90 hover:border-black transition-all duration-200 group shadow-2xs"
                            title="Twitter / X"
                          >
                            <FaXTwitter className="text-black group-hover:text-white text-sm shrink-0 transition-colors" />
                            <span className="hidden sm:inline">Twitter / X</span>
                          </a>
                        )}
                        {selectedMember.socials.facebook && (
                          <a
                            href={selectedMember.socials.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2 sm:px-3 sm:py-2 bg-white hover:bg-[#1877f2] hover:text-white text-gray-700 text-xs font-semibold border border-gray-200/90 hover:border-[#1877f2] transition-all duration-200 group shadow-2xs"
                            title="Facebook"
                          >
                            <FaFacebookF className="text-[#1877f2] group-hover:text-white text-sm shrink-0 transition-colors" />
                            <span className="hidden sm:inline">Facebook</span>
                          </a>
                        )}
                        {selectedMember.socials.whatsapp && (
                          <a
                            href={selectedMember.socials.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2 sm:px-3 sm:py-2 bg-white hover:bg-[#0ea545] hover:text-white text-gray-700 text-xs font-semibold border border-gray-200/90 hover:border-[#0ea545] transition-all duration-200 group shadow-2xs"
                            title="WhatsApp"
                          >
                            <FaWhatsapp className="text-[#0ea545] group-hover:text-white text-sm shrink-0 transition-colors" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        )}
                        {selectedMember.socials.website && (
                          <a
                            href={selectedMember.socials.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2 sm:px-3 sm:py-2 bg-white hover:bg-primary hover:text-white text-gray-700 text-xs font-semibold border border-gray-200/90 hover:border-primary transition-all duration-200 group shadow-2xs"
                            title="Website"
                          >
                            <BsGlobe2 className="text-primary group-hover:text-white text-sm shrink-0 transition-colors" />
                            <span className="hidden sm:inline">Website</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Detailed Bio & Core Competencies */}
                <div className="flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-start bg-white overflow-y-visible md:overflow-y-auto">

                  {/* Profile Statement */}
                  <div className="mb-6">
                    <h4 className="text-[12px] uppercase tracking-wider font-bold text-gray-400 mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Profile
                    </h4>
                    <p className="text-sm md:text-[14px] text-gray-600 leading-relaxed font-medium text-justify">
                      {selectedMember.description}
                    </p>
                  </div>

                  {/* Key Areas of Expertise */}
                  {selectedMember.expertise && selectedMember.expertise.length > 0 && (
                    <div>
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        Key Areas of Expertise
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedMember.expertise.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-gray-200/80 text-gray-800 text-xs sm:text-[13px] font-medium leading-snug hover:border-secondary/40 hover:bg-secondary/5 transition-all duration-200 group"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary group-hover:bg-primary mt-1.5 shrink-0 transition-colors" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
