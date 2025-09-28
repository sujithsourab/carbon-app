import React, { createContext, useContext, useState } from 'react';
import { ProjectInfo, GeneratedDocument, DocumentSection } from '../types';
import { cloudflareClient } from '../utils/cloudflare';

interface ProjectContextType {
  projectInfo: ProjectInfo | null;
  generatedDocument: GeneratedDocument | null;
  isLoading: boolean;
  saveProjectInfo: (info: ProjectInfo) => Promise<ProjectInfo>;
  generateDocument: (info?: ProjectInfo) => Promise<boolean>;
  clearProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const saveProjectInfo = async (info: ProjectInfo): Promise<ProjectInfo> => {
    try {
      const savedProject = await cloudflareClient.createProject(info);
      setProjectInfo(savedProject);
      return savedProject;
    } catch (error) {
      console.error('Error saving project:', error);
      // Fallback to local storage for demo purposes
      const savedInfo = {
        ...info,
        id: info.id || crypto.randomUUID(),
      };
      setProjectInfo(savedInfo);
      return savedInfo;
    }
  };

  const generateDocument = async (info?: ProjectInfo): Promise<boolean> => {
    const projectData = info || projectInfo;
    
    if (!projectData) {
      console.error('No project info available');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Simulate AI processing with a shorter delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const sections = projectData.template 
        ? await generateTemplateBasedDocument(projectData)
        : generateStandardDocument(projectData);
      
      // Add Cover Page as Section 0
      const coverPage: DocumentSection = {
        id: '0',
        title: 'COVER PAGE',
        content: '',
      };
      
      // Use default values for cover page
      const name = projectData.name || 'Sample Carbon Project';
      const startDate = projectData.startDate || new Date().toISOString().split('T')[0];
      const endDate = projectData.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 30)).toISOString().split('T')[0];
      
      coverPage.content = `Project Title: ${name}

Logo: <Your logo here>
Project ID: VCS####

Crediting Period: ${new Date(startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })} to ${new Date(endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}

Original Date of Issue: ${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}

Most Recent Date of Issue: ${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}

Version: 1.0

VCS Standard Version: 4.7

Prepared By: 
Organization: Your Organisation Name
Address: Your registered office address
Contact: email of your company`;

      sections.unshift(coverPage);
      
      setGeneratedDocument({ sections });
      return true;
      
    } catch (error) {
      console.error('Error generating document:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearProject = () => {
    setProjectInfo(null);
    setGeneratedDocument(null);
  };

  return (
    <ProjectContext.Provider
      value={{
        projectInfo,
        generatedDocument,
        isLoading,
        saveProjectInfo,
        generateDocument,
        clearProject
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

const generateTemplateBasedDocument = async (projectInfo: ProjectInfo): Promise<DocumentSection[]> => {
  // Use default values if project info is missing
  const name = projectInfo.name || 'Sample Carbon Project';
  const location = projectInfo.location || 'Sample Location';
  const projectType = projectInfo.projectType || 'Afforestation';
  const methodology = projectInfo.methodology || 'VM0047';
  const description = projectInfo.description || 'This is a sample carbon project description generated for demonstration purposes.';
  const startDate = projectInfo.startDate || new Date().toISOString().split('T')[0];

  return [
    {
      id: '1',
      title: 'EXECUTIVE SUMMARY',
      content: `${name} represents a significant initiative in carbon sequestration through ${projectType} activities. Located in ${location}, this project follows the ${methodology} methodology to ensure robust carbon accounting and monitoring.`,
      subsections: [
        {
          id: '1.1',
          title: 'Project Overview',
          content: description
        },
        {
          id: '1.2',
          title: 'Expected Outcomes',
          content: `Through implementation of ${projectType} activities, this project aims to deliver significant climate benefits while supporting sustainable development in ${location}.`
        }
      ]
    },
    {
      id: '2',
      title: 'PROJECT DETAILS',
      content: 'Comprehensive overview of project implementation and management.',
      subsections: [
        {
          id: '2.1',
          title: 'Location and Boundaries',
          content: `The project is strategically located in ${location}, chosen for its significant potential for carbon sequestration and environmental impact.`
        },
        {
          id: '2.2',
          title: 'Implementation Timeline',
          content: `Project activities commenced on ${startDate}, with a structured approach to achieving carbon benefits.`
        }
      ]
    },
    {
      id: '3',
      title: 'METHODOLOGY APPLICATION',
      content: `This project applies the ${methodology} methodology, ensuring compliance with international standards for carbon accounting.`,
      subsections: [
        {
          id: '3.1',
          title: 'Baseline Scenario',
          content: 'The baseline scenario represents the most likely land-use scenario in the absence of project activities.'
        },
        {
          id: '3.2',
          title: 'Project Scenario',
          content: `Under the project scenario, ${projectType} activities will be implemented to enhance carbon sequestration and deliver climate benefits.`
        }
      ]
    }
  ];
};

const generateStandardDocument = (projectInfo: ProjectInfo): DocumentSection[] => {
  // Use default values if project info is missing
  const name = projectInfo.name || 'Sample Carbon Project';
  const location = projectInfo.location || 'Sample Location';
  const projectType = projectInfo.projectType || 'Afforestation';
  const methodology = projectInfo.methodology || 'VM0047';
  const description = projectInfo.description || 'This is a sample carbon project description generated for demonstration purposes.';
  const startDate = projectInfo.startDate || new Date().toISOString().split('T')[0];
  const endDate = projectInfo.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 30)).toISOString().split('T')[0];

  return [
    {
      id: '1',
      title: 'PROJECT DETAILS',
      content: `${name} is a comprehensive ${projectType} carbon project designed to sequester carbon dioxide through strategic reforestation and ecosystem restoration activities. This project description document outlines the technical specifications, methodological approach, and expected climate benefits of the initiative in accordance with the requirements of the Verified Carbon Standard (VCS).`,
      subsections: [
        {
          id: '1.1',
          title: 'Summary Description of the Project',
          content: `${name} is a rigorously designed ${projectType} carbon project located in ${location}. The project commenced on ${new Date(startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})} and follows the ${methodology} methodology for carbon accounting and monitoring.

This initiative aims to transform approximately 5,000 hectares of degraded land through strategic planting of native and climate-adapted tree species, creating a mosaic landscape that maximizes both carbon sequestration and biodiversity benefits. The project is expected to sequester approximately 1.2 million tonnes of CO₂ equivalent over its 30-year crediting period.

${description}

The project incorporates comprehensive monitoring systems using a combination of ground-based measurements and remote sensing technologies to ensure accurate quantification of carbon stocks and changes over time. Implementation follows a phased approach with community engagement as a central component, ensuring sustainable outcomes and multiple co-benefits beyond carbon sequestration.`
        },
        {
          id: '1.2',
          title: 'Audit History',
          content: `This is the first submission of the project for validation under the VCS Program. The project has undergone a preliminary feasibility assessment conducted by EcoCarbon Consultants in January 2023, which confirmed the technical and financial viability of the proposed activities.

Prior to this submission, a pre-validation gap analysis was completed in March 2024 by ForestCert Auditors to identify any potential compliance issues with the VCS requirements. All recommendations from this analysis have been incorporated into the current project design.

The project has not been submitted to any other GHG programs or certification schemes. All emission reductions and removals will be registered exclusively under the VCS Program to avoid any risk of double counting.`
        },
        {
          id: '1.3',
          title: 'Sectoral Scope and Project Type',
          content: `The project falls under the Agriculture, Forestry, and Other Land Use (AFOLU) sectoral scope as defined by the VCS Program. It is specifically categorized as an ${projectType} project type, focusing on the establishment of forest vegetation on land that did not previously contain forest cover or where forest cover was significantly degraded.

The project activities align with the requirements and procedures outlined in the ${methodology} methodology. This methodology was selected based on its applicability to the specific ecological conditions, land-use history, and project objectives in ${location}.

The project boundaries encompass a total area of 5,000 hectares, consisting of multiple land parcels that meet the VCS definition of eligible lands for ${projectType} activities. These lands were systematically identified through a combination of remote sensing analysis, field surveys, and historical land-use records to ensure compliance with the additionality and eligibility requirements of the methodology.`
        },
        {
          id: '1.4',
          title: 'Project Eligibility',
          content: `The project has been designed to meet all eligibility requirements specified in the VCS Standard v4.4 and the applied methodology. A comprehensive eligibility assessment was conducted to ensure full compliance with all applicable criteria.`,
          subsections: [
            {
              id: '1.4.1',
              title: 'General eligibility',
              content: `The project meets all general eligibility requirements as specified in the VCS Standard v4.4, including:

1. Right of Use: The project proponent has secured clear and uncontested legal rights to the project area through a combination of land ownership titles and long-term land use agreements with local communities. All necessary documentation has been compiled in Appendix A.

2. Project Start Date: The project start date is ${new Date(projectInfo.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})}, which is within the allowable timeframe for project registration under the VCS Program.

3. Project Crediting Period: The project has selected a 30-year crediting period, which is within the allowable range for AFOLU projects under the VCS Program.

4. Project Scale: Based on the estimated annual GHG emission reductions and removals of approximately 40,000 tCO₂e, this project is classified as a "major project" according to VCS definitions.

5. Completion of VCS Project Description: This document constitutes the complete VCS Project Description as required by the program.`
            },
            {
              id: '1.4.2',
              title: 'AFOLU project eligibility',
              content: `As an ${projectType} project under the AFOLU category, the project meets the following specific eligibility criteria:

1. Land Eligibility: All lands within the project boundary have been non-forest for at least 10 years prior to the project start date, as demonstrated through historical satellite imagery analysis and land-use records (see Appendix B for detailed land eligibility assessment).

2. Additionality: The project activities are demonstrably additional as they face significant barriers to implementation without carbon finance, including:
   • Investment barriers: The high upfront costs and delayed returns from forestry activities make the project financially unattractive without carbon revenue
   • Technological barriers: The implementation of advanced monitoring systems and sustainable forestry practices requires expertise not commonly available in the region
   • Institutional barriers: Complex land tenure arrangements and regulatory requirements create significant hurdles for project implementation

3. Permanence: The project has conducted a thorough non-permanence risk assessment following the AFOLU Non-Permanence Risk Tool and has determined a risk buffer of 20% to address potential reversals. Key risk mitigation measures include:
   • Diversification of tree species to reduce vulnerability to pests and diseases
   • Implementation of comprehensive fire management protocols
   • Strong community engagement to ensure long-term stewardship
   • Legal protection mechanisms for the project area

4. Biomass Burning: The project design explicitly prohibits the use of biomass burning for site preparation or management activities, in compliance with VCS requirements.`
            },
            {
              id: '1.4.3',
              title: 'Transfer project eligibility',
              content: `Not applicable as this is a new project registration rather than a transfer from another GHG program.`
            }
          ]
        },
        {
          id: '1.5',
          title: 'Project Design',
          content: `The project employs a science-based approach to forest establishment and management, designed to maximize both carbon sequestration and ecological co-benefits. The design incorporates the following key elements:

1. Species Selection: The project utilizes a carefully selected mix of native and climate-adapted tree species, including Grevillea robusta, Eucalyptus spp., Acacia mearnsii, Markhamia lutea, and Cordia africana. This species portfolio was developed based on:
   • Suitability to local soil and climatic conditions
   • Growth rates and carbon sequestration potential
   • Resilience to climate change impacts
   • Biodiversity value and ecological functions
   • Economic value to local communities

2. Planting Design: The spatial arrangement of trees follows a mosaic pattern that mimics natural forest succession processes. This includes:
   • Variable density planting (500-1,500 trees per hectare) based on site conditions
   • Mixed-species blocks to enhance resilience and biodiversity
   • Riparian buffer zones with specialized species compositions
   • Natural regeneration areas where seed sources are available

3. Management Approach: The project implements sustainable forest management practices, including:
   • Minimal intervention after establishment to allow natural processes
   • Thinning operations only where necessary for forest health
   • Fire prevention measures and controlled access
   • Continuous monitoring and adaptive management

4. Community Integration: Local communities are engaged as key stakeholders through:
   • Employment opportunities in planting and maintenance activities
   • Capacity building in sustainable land management
   • Benefit-sharing mechanisms for non-timber forest products
   • Participatory monitoring and decision-making processes`,
          subsections: [
            {
              id: '1.5.1',
              title: 'Grouped project design',
              content: `This project is not designed as a grouped project. All project activities and areas are defined within the current project boundary, and no additional instances will be added in the future. The project has been designed with sufficient scale to achieve meaningful climate impact while maintaining manageable implementation complexity.`
            }
          ]
        },
        {
          id: '1.6',
          title: 'Project Proponent',
          content: `The project proponent is EcoRestore International, a non-profit organization with extensive experience in implementing forest restoration and carbon projects across multiple countries. EcoRestore International was established in 2010 and has successfully developed and managed over 15 forest carbon projects globally.

Key responsibilities of the project proponent include:
• Overall project management and coordination
• Financial oversight and carbon asset management
• Technical implementation of forest restoration activities
• Stakeholder engagement and community relations
• Monitoring, reporting, and verification coordination
• Compliance with VCS requirements and methodology application

EcoRestore International brings significant technical expertise in forest carbon project development, with a team of forestry experts, carbon specialists, community engagement professionals, and GIS analysts. The organization maintains a permanent office in ${location} with a staff of 25 professionals dedicated to this project.

Contact information:
• Organization: EcoRestore International
• Primary Contact: Dr. Sarah Johnson, Project Director
• Email: sjohnson@ecorestore.org
• Phone: +1-555-123-4567
• Address: 123 Forest Way, Green City, ${location}`
        },
        {
          id: '1.7',
          title: 'Other Entities Involved in the Project',
          content: `Several key entities are involved in the implementation and support of this project:

1. Local Government of ${location}
   • Role: Regulatory oversight and policy support
   • Responsibilities: Land use permits, alignment with local development plans
   • Contact: Department of Environment and Natural Resources

2. Community Forest Association of ${location}
   • Role: Community mobilization and participation
   • Responsibilities: Local labor coordination, community benefit distribution
   • Contact: Mr. James Mbeki, Association Chairperson

3. Technical University of ${location}
   • Role: Technical partner for monitoring and research
   • Responsibilities: Carbon stock assessment, biodiversity monitoring
   • Contact: Dr. Elena Rodriguez, Department of Forestry Sciences

4. Stakeholder Name
   • Role: Financial partner
   • Responsibilities: Project finance, carbon credit commercialization
   • Contact: 

5. Stakeholder Name
   • Role: Technology provider
   • Responsibilities: Remote sensing and GIS services, monitoring platform
   • Contact: #######

Each entity has signed a Memorandum of Understanding (MOU) with the project proponent, clearly defining roles, responsibilities, and benefit-sharing arrangements. These agreements ensure transparent governance and accountability throughout the project lifetime.`
        }
      ]
    },
    {
      id: '2',
      title: 'SAFEGUARDS AND STAKEHOLDER ENGAGEMENT',
      content: `The project has been designed and is being implemented with careful attention to environmental and social safeguards, following both VCS requirements and international best practices. A comprehensive stakeholder engagement process has been established to ensure inclusive participation and equitable benefit sharing.`,
      subsections: [
        {
          id: '2.1',
          title: 'Stakeholder Engagement and Consultation',
          content: `The project has implemented a robust stakeholder engagement process based on the principles of Free, Prior, and Informed Consent (FPIC). This process began during the project design phase and will continue throughout the project lifetime, ensuring that all affected communities and relevant stakeholders have meaningful opportunities to participate in decision-making.`,
          subsections: [
            {
              id: '2.1.1',
              title: 'Stakeholder Identification',
              content: `A comprehensive stakeholder mapping exercise was conducted at project inception, identifying the following key stakeholder groups:

1. Primary stakeholders (directly affected):
   • Local communities living within and adjacent to the project area (approximately 12,000 people across 15 villages)
   • Smallholder farmers with customary land rights in the project area
   • Indigenous groups with historical connections to the land
   • Local forest user groups and associations

2. Secondary stakeholders:
   • Local and national government agencies
   • Civil society organizations working in forestry and conservation
   • Academic and research institutions
   • Private sector entities in the forestry and agricultural sectors

3. Other interested parties:
   • International development agencies
   • Environmental NGOs
   • Carbon market participants and investors

The stakeholder identification process included spatial mapping of communities, demographic analysis, and assessment of formal and informal land use rights. Special attention was given to identifying vulnerable and marginalized groups to ensure their inclusion in the consultation process.`
            },
            {
              id: '2.1.2',
              title: 'Stakeholder Consultation and Ongoing Communication',
              content: `The project has implemented a multi-tiered stakeholder consultation strategy:

1. Initial Consultation Phase (Completed):
   • 15 community-level meetings with 850+ participants
   • 3 district-level workshops with government and civil society representatives
   • 1 national-level stakeholder forum
   • Individual consultations with key informants and representatives of vulnerable groups

2. Feedback Incorporation:
   • All stakeholder inputs were documented and categorized
   • Project design was modified based on community feedback, including:
     - Adjustment of species selection to include more multi-purpose trees
     - Revision of benefit-sharing mechanisms to ensure equitable distribution
     - Modification of implementation schedule to accommodate agricultural calendars
     - Inclusion of additional livelihood activities requested by communities

3. Ongoing Communication Mechanisms:
   • Quarterly community meetings in each project village
   • Bi-annual stakeholder advisory committee meetings
   • Grievance redress mechanism with multiple access points
   • Regular project updates through local radio programs and information boards
   • Dedicated community liaison officers for day-to-day communication

All consultation activities are documented through meeting minutes, attendance records, photographs, and signed agreements. These records are maintained in the project database and are available for verification purposes.`
            }
          ]
        },
        {
          id: '2.2',
          title: 'Risks to Stakeholders and the Environment',
          content: `A comprehensive risk assessment was conducted to identify potential negative impacts on stakeholders and the environment. This assessment followed the principles of the mitigation hierarchy: avoid, minimize, mitigate, and compensate.

1. Identified Risks to Stakeholders:
   • Potential restriction of access to land and resources
   • Possible changes in traditional land use practices
   • Risk of inequitable benefit distribution
   • Potential for elite capture of project benefits
   • Labor safety concerns during implementation activities

2. Mitigation Measures for Stakeholder Risks:
   • Development of community resource use agreements that maintain access rights
   • Phased implementation approach to allow gradual adaptation of land use practices
   • Transparent benefit-sharing plan with community oversight
   • Targeted inclusion strategies for vulnerable groups
   • Comprehensive occupational health and safety protocols

3. Identified Environmental Risks:
   • Potential for introduction of invasive species
   • Water table impacts from fast-growing tree species
   • Soil disturbance during planting activities
   • Temporary reduction in habitat for certain grassland species
   • Fire risk during dry seasons

4. Mitigation Measures for Environmental Risks:
   • Rigorous species selection process with invasive species screening
   • Hydrological assessment and monitoring program
   • Reduced-impact planting techniques and erosion control measures
   • Mosaic planting design to maintain habitat diversity
   • Fire management plan and community-based fire brigades

The project has established an Environmental and Social Management Plan (ESMP) that details all identified risks, mitigation measures, monitoring requirements, and responsible parties. This plan is reviewed and updated annually based on monitoring results and stakeholder feedback.`
        }
      ]
    },
    {
      id: '3',
      title: 'APPLICATION OF METHODOLOGY',
      content: `The project applies a rigorous methodological approach to ensure accurate quantification of greenhouse gas emission reductions and removals, following all requirements of the selected methodology and the VCS Program.`,
      subsections: [
        {
          id: '3.1',
          title: 'Title and Reference of Methodology',
          content: `This project applies the ${methodology} methodology for quantification of GHG emission reductions and removals. The methodology was approved under the Verified Carbon Standard (VCS) Program and is appropriate for ${projectType} activities.

In addition to the primary methodology, the project utilizes the following tools and modules:
• VCS AFOLU Non-Permanence Risk Tool, v4.0
• CDM Tool for the Demonstration and Assessment of Additionality
• VCS Global Warming Potential Values, v4.0
• VCS Standard, v4.4

The project team has conducted a thorough review of all methodology requirements and has designed the project to ensure full compliance with all applicable criteria and procedures.`
        },
        {
          id: '3.2',
          title: 'Applicability of Methodology',
          content: `The project meets all applicability conditions of the ${methodology} methodology as demonstrated below:

1. Land Eligibility: All lands within the project boundary qualify as eligible lands for ${projectType} activities as they were non-forest for at least 10 years prior to the project start date. This has been demonstrated through analysis of historical satellite imagery from 2010-2023 and confirmed through ground-truthing surveys.

2. Project Activities: The project involves the direct human-induced conversion of non-forest land to forest land through planting, seeding, and promotion of natural seed sources. These activities align with the definition of ${projectType} under the methodology.

3. Carbon Pools: The project accounts for the required carbon pools specified in the methodology, including above-ground biomass, below-ground biomass, and soil organic carbon. Dead wood and litter pools are conservatively excluded from the accounting.

4. Baseline Scenario: The baseline scenario represents the continuation of pre-project land use, which has been demonstrated to be the most likely scenario in the absence of the project. This scenario has been established through historical land use analysis, socioeconomic assessment, and stakeholder consultations.

5. Additionality: The project activities are additional to business-as-usual as demonstrated through application of the CDM Tool for the Demonstration and Assessment of Additionality (see Section 3.4 for details).

6. Project Boundary: The project boundary has been clearly defined using GPS coordinates and GIS mapping, encompassing all areas where project activities will be implemented.

7. Leakage: The project has identified potential sources of leakage and has implemented appropriate mitigation measures as required by the methodology.

The project does not have any characteristics that would make the methodology inapplicable, such as the presence of wetlands or peatlands, planned harvesting activities, or the use of non-native invasive species.`
        },
        {
          id: '3.3',
          title: 'Project Boundary',
          content: `The project boundary encompasses the forest area located in ${location} where project activities are implemented. The boundary has been delineated using a combination of GPS field surveys, high-resolution satellite imagery, and cadastral maps.

1. Spatial Boundary:
   • Total project area: 5,000 hectares
   • Number of discrete parcels: 8
   • Elevation range: 1,200-1,800 meters above sea level
   • Coordinates: The precise coordinates of each parcel are provided in Appendix C, along with GIS shapefiles

2. Temporal Boundary:
   • Project start date: ${new Date(startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})}
   • Project crediting period: 30 years (non-renewable)
   • Crediting period start date: ${new Date(startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})}
   • Crediting period end date: ${new Date(new Date(startDate).setFullYear(new Date(startDate).getFullYear() + 30)).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})}

3. Carbon Pools Included:
   • Above-ground biomass: Included (significant)
   • Below-ground biomass: Included (significant)
   • Dead wood: Excluded (conservative exclusion)
   • Litter: Excluded (conservative exclusion)
   • Soil organic carbon: Included (significant)
   • Wood products: Excluded (not applicable as no harvesting is planned)

4. GHG Sources Included:
   • CO₂: Included for all carbon pools
   • CH₄: Excluded (insignificant)
   • N₂O: Excluded (insignificant)

The project boundary has been established in accordance with the requirements of the ${methodology} methodology and the VCS Standard. All areas within the project boundary meet the eligibility criteria for ${projectType} activities.`
        }
      ]
    },
    {
      id: '4',
      title: 'QUANTIFICATION OF GHG EMISSION REDUCTIONS AND REMOVALS',
      content: `This section details the quantification of greenhouse gas emission reductions and removals expected from the project activities, following the procedures outlined in the ${projectInfo.methodology} methodology.`,
      subsections: [
        {
          id: '4.1',
          title: 'Baseline Emissions',
          content: `The baseline scenario represents the most likely land-use scenario in the absence of project activities. For this project, the baseline scenario is the continuation of degraded grassland and shrubland with minimal carbon stocks.

Baseline carbon stocks were determined through a combination of field measurements and conservative default values from the methodology. The following approach was used:

1. Stratification: The project area was stratified into 4 distinct strata based on vegetation type, soil characteristics, and land-use history:
   • Stratum 1: Degraded grassland (2,200 hectares)
   • Stratum 2: Shrubland with scattered trees (1,500 hectares)
   • Stratum 3: Abandoned agricultural land (800 hectares)
   • Stratum 4: Eroded slopes (500 hectares)

2. Field Sampling:
   • A systematic sampling design was implemented with 120 permanent sample plots
   • Plot size: 400 m² circular plots for trees, with nested subplots for other vegetation
   • Measurements included DBH, height, species identification, and soil samples
   • Sampling intensity: 1 plot per 42 hectares, exceeding methodology requirements

3. Carbon Stock Calculation:
   • Above-ground biomass: Calculated using allometric equations specific to each vegetation type
   • Below-ground biomass: Estimated using root-to-shoot ratios from IPCC guidelines
   • Soil organic carbon: Measured through laboratory analysis of soil samples

The resulting baseline carbon stocks are:
• Stratum 1: 5.2 tC/ha (19.1 tCO₂e/ha)
• Stratum 2: 12.8 tC/ha (47.0 tCO₂e/ha)
• Stratum 3: 8.5 tC/ha (31.2 tCO₂e/ha)
• Stratum 4: 3.1 tC/ha (11.4 tCO₂e/ha)
• Weighted average across project area: 7.6 tC/ha (27.9 tCO₂e/ha)

Under the baseline scenario, these carbon stocks are expected to remain stable or decline slightly over the crediting period due to ongoing degradation pressures. No significant carbon sequestration would occur in the absence of project activities.

The baseline will be reassessed every 10 years as required by the methodology to account for any changes in conditions or regulatory requirements.`
        },
        {
          id: '4.2',
          title: 'Project Emissions',
          content: `Project emissions refer to the GHG emissions that occur as a result of project implementation activities. For this ${projectInfo.projectType} project, the following sources of project emissions have been identified and quantified:

1. Emissions from Fossil Fuel Consumption:
   • Sources: Vehicles used for transportation of seedlings, equipment, and personnel; machinery used for site preparation
   • Quantification approach: Fuel consumption records multiplied by emission factors from IPCC guidelines
   • Estimated emissions: 125 tCO₂e over the first 5 years of implementation (insignificant compared to project removals)

2. Emissions from Biomass Loss During Site Preparation:
   • Sources: Clearing of non-tree vegetation prior to planting
   • Quantification approach: Area-based assessment of biomass removed, converted to CO₂e using appropriate factors
   • Estimated emissions: 850 tCO₂e in year 1 (one-time emission)

3. Emissions from Fertilizer Application:
   • Sources: N₂O emissions from limited fertilizer use during establishment phase
   • Quantification approach: Quantity of nitrogen applied multiplied by N₂O emission factors
   • Estimated emissions: 75 tCO₂e over the first 3 years (insignificant)

Total project emissions are estimated at 1,050 tCO₂e over the first 5 years, primarily occurring during the establishment phase. After year 5, ongoing project emissions are expected to be minimal as management activities will be limited to monitoring and maintenance.

These project emissions will be deducted from the total carbon removals to calculate net GHG benefits. The project employs best practices to minimize emissions, including:
• Efficient transportation planning to reduce vehicle use
• Minimal site preparation techniques to reduce soil disturbance
• Limited and targeted use of fertilizers only where necessary
• Use of manual labor instead of machinery where feasible`
        },
        {
          id: '4.3',
          title: 'Leakage Emissions',
          content: `Leakage refers to the potential displacement of activities that could lead to increased GHG emissions outside the project boundary as a result of project implementation. For this ${projectInfo.projectType} project, the following leakage assessment has been conducted:

1. Activity Displacement Leakage:
   • Pre-project activities: The project area was primarily used for low-intensity grazing and limited subsistence agriculture
   • Potential displacement: Some grazing and agricultural activities could be displaced to surrounding areas
   • Mitigation measures: 
     - Implementation of sustainable intensification practices on adjacent agricultural lands
     - Development of improved grazing management plans for surrounding pastures
     - Alternative livelihood programs for affected households
   • Quantification: Following the methodology, activity displacement leakage is estimated at 8% of the net carbon benefits

2. Market Leakage:
   • Assessment: The project does not significantly affect timber or agricultural product markets as it does not reduce production of market goods
   • Quantification: Market leakage is determined to be zero in accordance with the methodology

3. Ecological Leakage:
   • Assessment: No significant risk of ecological leakage (e.g., changes in fire regimes or hydrology affecting carbon stocks outside the project area)
   • Quantification: Ecological leakage is determined to be zero

Total leakage emissions are estimated at 96,000 tCO₂e over the 30-year crediting period (8% of gross carbon removals). This estimate is conservative and will be monitored throughout the project lifetime.

The project has established a leakage management zone surrounding the project area where leakage mitigation activities are implemented. The effectiveness of these measures will be assessed through regular monitoring of land-use changes in the leakage belt using remote sensing and ground surveys.`
        },
        {
          id: '4.4',
          title: 'Net GHG Emission Reductions and Removals',
          content: `The net GHG emission reductions and removals are calculated by subtracting baseline emissions, project emissions, and leakage from the project's carbon sequestration. Based on growth models calibrated for the selected tree species and local conditions, the following estimates have been developed:

1. Gross Carbon Sequestration:
   • Year 1-5: 85,000 tCO₂e (establishment phase)
   • Year 6-10: 210,000 tCO₂e (early growth phase)
   • Year 11-20: 520,000 tCO₂e (accelerated growth phase)
   • Year 21-30: 385,000 tCO₂e (maturation phase)
   • Total gross sequestration: 1,200,000 tCO₂e over 30 years

2. Net Carbon Benefit Calculation:
   • Gross carbon sequestration: 1,200,000 tCO₂e
   • Minus baseline emissions: 0 tCO₂e (conservative approach)
   • Minus project emissions: 1,050 tCO₂e
   • Minus leakage emissions: 96,000 tCO₂e
   • Net carbon benefit before buffer: 1,102,950 tCO₂e

3. Non-Permanence Risk Buffer:
   • Risk assessment score: 20% (detailed in Appendix D)
   • Buffer contribution: 220,590 tCO₂e

4. Net Verified Carbon Units (VCUs):
   • Total VCUs over 30 years: 882,360 VCUs
   • Average annual VCUs: 29,412 VCUs/year

The project expects to generate approximately 882,360 Verified Carbon Units (VCUs) over its 30-year crediting period. The temporal distribution of these credits follows a sigmoid curve, with lower removals in the early years, peak removals in years 11-20, and a gradual leveling off as the forest matures.

These estimates are based on conservative growth models and will be verified through rigorous monitoring of actual carbon stock changes throughout the project lifetime. The first verification is scheduled for year 5 after implementation, with subsequent verifications every 2-3 years.`
        }
      ]
    },
    {
      id: '5',
      title: 'MONITORING',
      content: `A comprehensive monitoring plan has been developed to track GHG removals, project impacts, and compliance with methodology requirements throughout the project lifetime. This plan follows the monitoring requirements specified in the ${projectInfo.methodology} methodology and incorporates best practices in forest carbon monitoring.`,
      subsections: [
        {
          id: '5.1',
          title: 'Data and Parameters Available at Validation',
          content: `The following key data and parameters were determined at the project validation stage and will remain fixed throughout the crediting period:

1. Historical Land Cover and Land Use:
   • Parameter: Historical forest/non-forest status
   • Data unit: Categorical (forest/non-forest)
   • Source of data: Landsat satellite imagery (2010-2023)
   • Value applied: All project areas classified as non-forest for at least 10 years prior to project start
   • Justification: Analysis conducted following methodology requirements with 30m resolution imagery

2. Baseline Carbon Stocks:
   • Parameter: Carbon stocks in baseline scenario by stratum
   • Data unit: tC/ha
   • Source of data: Field measurements and IPCC defaults
   • Values applied: Stratum 1: 5.2 tC/ha; Stratum 2: 12.8 tC/ha; Stratum 3: 8.5 tC/ha; Stratum 4: 3.1 tC/ha
   • Justification: Conservative estimates based on field sampling following methodology requirements

3. Allometric Equations:
   • Parameter: Species-specific allometric equations
   • Data unit: Various
   • Source of data: Peer-reviewed scientific literature specific to the region
   • Values applied: See Appendix E for complete list of equations
   • Justification: Selected based on applicability to project species and conditions

4. Root-to-Shoot Ratios:
   • Parameter: Root-to-shoot ratios by species group
   • Data unit: Dimensionless
   • Source of data: IPCC Guidelines for National GHG Inventories
   • Values applied: Broadleaf: 0.24; Conifer: 0.29; Mixed: 0.26
   • Justification: Conservative values from internationally recognized source

5. Wood Densities:
   • Parameter: Basic wood density by species
   • Data unit: t d.m./m³
   • Source of data: Global Wood Density Database and local studies
   • Values applied: See Appendix E for complete list
   • Justification: Species-specific values from reliable sources

All parameters were determined using the methods specified in the applied methodology and are supported by appropriate documentation, including scientific references, field measurement protocols, and quality assurance procedures.`
        },
        {
          id: '5.2',
          title: 'Data and Parameters Monitored',
          content: `The following key data and parameters will be monitored throughout the project crediting period:

1. Forest Establishment and Growth:
   • Parameter: Tree diameter at breast height (DBH)
   • Frequency: Every 2-3 years
   • Sampling design: Stratified random sampling with permanent plots
   • QA/QC procedures: Trained field teams, calibrated equipment, 10% independent verification

2. Forest Establishment and Growth:
   • Parameter: Tree height
   • Frequency: Every 2-3 years
   • Sampling design: Subsample of trees measured for DBH
   • QA/QC procedures: Trained field teams, calibrated equipment, 10% independent verification

3. Forest Establishment and Growth:
   • Parameter: Tree survival rate
   • Frequency: Annually for first 5 years, then every 2-3 years
   • Sampling design: Stratified random sampling with permanent plots
   • QA/QC procedures: Cross-verification with planting records

4. Forest Establishment and Growth:
   • Parameter: Area of forest established
   • Frequency: Annually until full implementation, then every 5 years
   • Sampling design: GPS boundary mapping and remote sensing verification
   • QA/QC procedures: Independent verification of boundaries

5. Disturbances:
   • Parameter: Area affected by disturbance (fire, pest, etc.)
   • Frequency: Continuous monitoring with formal assessment annually
   • Sampling design: Remote sensing with ground verification
   • QA/QC procedures: Incident reporting system with photographic evidence

6. Project Emissions:
   • Parameter: Fuel consumption for project activities
   • Frequency: Monthly recording with annual compilation
   • Sampling design: Activity logs and fuel purchase records
   • QA/QC procedures: Cross-check with receipts and vehicle logs

7. Leakage:
   • Parameter: Land-use change in leakage belt
   • Frequency: Every 5 years
   • Sampling design: Remote sensing analysis with ground verification
   • QA/QC procedures: Independent verification of analysis

The complete list of monitored parameters, including detailed descriptions of monitoring methods, frequencies, and QA/QC procedures, is provided in Appendix F.`
        },
        {
          id: '5.3',
          title: 'Monitoring Plan',
          content: `The monitoring plan integrates field measurements, remote sensing analysis, and community-based monitoring to ensure accurate and cost-effective tracking of project outcomes. The plan includes the following components:

1. Organizational Structure and Responsibilities:
   • Project Manager: Overall responsibility for monitoring implementation
   • Technical Coordinator: Supervision of field measurements and data analysis
   • GIS Specialist: Remote sensing analysis and spatial data management
   • Field Teams: Collection of ground data
   • Community Monitors: Reporting of disturbances and implementation of basic measurements
   • External Verification Body: Independent verification of carbon stocks

2. Monitoring Methods:
   • Forest Carbon Stocks: Permanent sample plot network with stratified random sampling
   • Spatial Monitoring: Combination of high-resolution satellite imagery and drone surveys
   • Disturbance Monitoring: Early warning system using FIRMS fire alerts and regular field patrols
   • Leakage Monitoring: Remote sensing analysis of land-use change in the leakage belt
   • Social Impacts: Participatory monitoring through household surveys and focus group discussions

3. Data Management System:
   • Digital data collection using mobile applications
   • Cloud-based database with automated quality checks
   • Regular backups and data security protocols
   • Version control for all datasets and analyses

4. Quality Assurance and Quality Control:
   • Comprehensive field manual with standardized procedures
   • Training program for all monitoring personnel
   • Regular calibration of measurement equipment
   • Independent verification of 10% of field measurements
   • Transparent documentation of all methods and results

5. Monitoring Schedule:
   • Initial carbon stock assessment: Completed prior to validation
   • Implementation monitoring: Monthly during establishment phase
   • Carbon stock monitoring: Every 2-3 years
   • Verification events: Years 5, 8, 11, 14, 17, 20, 23, 26, and 29

6. Adaptive Management:
   • Annual review of monitoring results
   • Protocol for addressing unexpected changes or disturbances
   • Mechanism for updating monitoring methods as technologies improve

The monitoring plan has been designed to meet all requirements of the ${projectInfo.methodology} methodology while optimizing for cost-effectiveness and operational feasibility. The plan will be reviewed and updated as needed throughout the project lifetime to incorporate lessons learned and technological advancements.`
        }
      ]
    }
  ];
};