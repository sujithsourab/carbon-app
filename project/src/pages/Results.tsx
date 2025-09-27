import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../context/ProjectContext";
import { AppRoutes, DocumentSection } from "../types";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { FileText, Download, Home, RefreshCw, BookOpen, Map, ClipboardList, Activity, Calculator, Edit, Save, X, RotateCcw, ArrowRight, Satellite, DollarSign } from "lucide-react";
import { generateDocx } from "../utils/documentGenerator";
import { TextArea } from "../components/ui/TextArea";

export function Results() {
  const { projectInfo, generatedDocument, clearProject } = useProject();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("1");
  const [showTemplate, setShowTemplate] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<string>("");
  const [editedSections, setEditedSections] = useState<Record<string, string>>({});

  if (!projectInfo || !generatedDocument) {
    navigate(AppRoutes.PROJECT_INFO);
    return null;
  }

  const handleStartNew = () => {
    clearProject();
    navigate(AppRoutes.PROJECT_INFO);
  };

  const renderSection = (section: DocumentSection, level = 0) => {
    const isActive = activeSection === section.id;
    const isMainSection = section.id.indexOf('.') === -1;
    const indentClass = level > 0 ? `ml-${level * 4}` : "";

    return (
      <React.Fragment key={section.id}>
        <li>
          <button
            className={`w-full text-left py-2 px-3 rounded-md transition-colors ${indentClass} ${
              isActive 
                ? "bg-primary-100 text-primary-700 font-medium" 
                : "hover:bg-gray-100"
            }`}
            onClick={() => {
              setActiveSection(section.id);
              setEditMode(false);
            }}
          >
            <span>{section.id}</span> {section.title}
          </button>
        </li>
        {section.subsections?.map(subsection => renderSection(subsection, level + 1))}
      </React.Fragment>
    );
  };

  const findSectionById = (
    sections: DocumentSection[],
    id: string
  ): DocumentSection | null => {
    for (const section of sections) {
      if (section.id === id) {
        return section;
      }
      if (section.subsections?.length) {
        const found = findSectionById(section.subsections, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  const baselineSection = findSectionById(generatedDocument.sections, "4.1");
  const additionalitySection = findSectionById(generatedDocument.sections, "3.2");
  const emissionsSection = findSectionById(generatedDocument.sections, "4.3");

  const activeContent = findSectionById(generatedDocument.sections, activeSection);

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const navigateToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setEditMode(false);
  };

  const isMainSectionOrChild = (sectionId: string): boolean => {
    if (activeSection.indexOf('.') === -1) {
      return sectionId === activeSection || sectionId.startsWith(`${activeSection}.`);
    }
    return sectionId === activeSection;
  };

  const getAllContent = (): JSX.Element[] => {
    const content: JSX.Element[] = [];
    
    if (activeSection.indexOf('.') === -1) {
      const mainSection = findSectionById(generatedDocument.sections, activeSection);
      if (mainSection) {
        content.push(
          <div key={mainSection.id}>
            <h2 className="text-xl font-bold text-primary-700 mb-4">
              {mainSection.id} {mainSection.title}
            </h2>
            {editedSections[mainSection.id] !== undefined ? 
              editedSections[mainSection.id].split('\n').map((paragraph, idx) => (
                <p key={`${mainSection.id}-p-${idx}`} className="mb-4">{paragraph}</p>
              ))
              : 
              mainSection.content && mainSection.content.split('\n').map((paragraph, idx) => (
                <p key={`${mainSection.id}-p-${idx}`} className="mb-4">{paragraph}</p>
              ))
            }
          </div>
        );

        const addSubsectionContent = (subsections: DocumentSection[], level: number = 1) => {
          subsections.forEach(subsection => {
            content.push(
              <div key={subsection.id} className="mt-6">
                <h3 className={`text-${level === 1 ? 'lg' : 'md'} font-bold text-primary-700 mb-3`}>
                  {subsection.id} {subsection.title}
                </h3>
                {editedSections[subsection.id] !== undefined ? 
                  editedSections[subsection.id].split('\n').map((paragraph, idx) => (
                    <p key={`${subsection.id}-p-${idx}`} className="mb-4">{paragraph}</p>
                  ))
                  : 
                  subsection.content && subsection.content.split('\n').map((paragraph, idx) => (
                    <p key={`${subsection.id}-p-${idx}`} className="mb-4">{paragraph}</p>
                  ))
                }
              </div>
            );

            if (subsection.subsections?.length) {
              addSubsectionContent(subsection.subsections, level + 1);
            }
          });
        };

        if (mainSection.subsections?.length) {
          addSubsectionContent(mainSection.subsections);
        }
      }
    } else {
      if (activeContent) {
        content.push(
          <div key={activeContent.id}>
            <h3 className="text-lg font-bold text-primary-700 mb-3">
              {activeContent.id} {activeContent.title}
            </h3>
            {editedSections[activeContent.id] !== undefined ? 
              editedSections[activeContent.id].split('\n').map((paragraph, idx) => (
                <p key={`${activeContent.id}-p-${idx}`} className="mb-4">{paragraph}</p>
              ))
              : 
              activeContent.content.split('\n').map((paragraph, idx) => (
                <p key={`${activeContent.id}-p-${idx}`} className="mb-4">{paragraph}</p>
              ))
            }
          </div>
        );
      }
    }

    return content;
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      const documentWithEdits = {
        sections: JSON.parse(JSON.stringify(generatedDocument.sections))
      };
      
      const applyEditsToSections = (sections: DocumentSection[]) => {
        for (const section of sections) {
          if (editedSections[section.id] !== undefined) {
            section.content = editedSections[section.id];
          }
          if (section.subsections?.length) {
            applyEditsToSections(section.subsections);
          }
        }
      };
      
      applyEditsToSections(documentWithEdits.sections);
      
      await generateDocx(projectInfo, documentWithEdits);
    } catch (error) {
      console.error("Error generating document:", error);
      alert("An error occurred while generating the document. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEdit = () => {
    if (activeContent) {
      setEditedContent(editedSections[activeContent.id] !== undefined ? 
        editedSections[activeContent.id] : 
        activeContent.content);
      setEditMode(true);
    }
  };

  const handleSave = () => {
    if (activeContent) {
      setEditedSections({
        ...editedSections,
        [activeContent.id]: editedContent
      });
      setEditMode(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleRevertToOriginal = () => {
    if (activeContent) {
      const updatedEditedSections = { ...editedSections };
      delete updatedEditedSections[activeContent.id];
      setEditedSections(updatedEditedSections);
      setEditMode(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-primary-50 to-earth-50 overflow-x-hidden">
      <div className="max-w-[2000px] mx-auto p-6">
        <Card className="mb-6 bg-white/90 backdrop-blur-sm">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-primary-700">{projectInfo.name}</h1>
                <p className="text-earth-600">
                  {projectInfo.projectType} carbon project in {projectInfo.location}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate(AppRoutes.PORTFOLIO)}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(AppRoutes.RS_ANALYSIS)}
                  className="bg-primary-50"
                >
                  <Satellite className="mr-2 h-4 w-4" />
                  RS Analysis
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(AppRoutes.SUMMARY)}
                  className="bg-primary-50"
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Project Summary
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(AppRoutes.CARBON_CALCULATOR)}
                  className="bg-primary-50"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Carbon Calculator
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(AppRoutes.FINANCIAL_MODEL)}
                  className="bg-primary-50"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Financial Model
                </Button>
                <Button variant="outline" onClick={() => setShowTemplate(!showTemplate)}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  {showTemplate ? 'Hide Template' : 'Show Template'}
                </Button>
                <Button onClick={handleDownload} disabled={isDownloading}>
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloading ? 'Generating...' : 'Download .docx'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-primary-600">Key Carbon Metrics</CardTitle>
            <CardDescription>
              Overview of project's carbon accounting and additionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-primary-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-primary-700 mb-2">Baseline Scenario</h3>
                <p className="text-primary-600 mb-3">
                  {baselineSection ? truncateText(baselineSection.content) : "Baseline calculations pending"}
                </p>
                {baselineSection && (
                  <Button 
                    variant="ghost" 
                    className="text-primary-600 hover:text-primary-700 p-0 h-auto flex items-center"
                    onClick={() => navigateToSection('4.1')}
                  >
                    Read more <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="bg-earth-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-earth-700 mb-2">Additionality</h3>
                <p className="text-earth-600 mb-3">
                  {additionalitySection ? truncateText(additionalitySection.content) : "Additionality assessment pending"}
                </p>
                {additionalitySection && (
                  <Button 
                    variant="ghost" 
                    className="text-earth-600 hover:text-earth-700 p-0 h-auto flex items-center"
                    onClick={() => navigateToSection('3.2')}
                  >
                    Read more <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="bg-primary-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-primary-700 mb-2">Expected VCUs</h3>
                <p className="text-primary-600 mb-3">
                  {emissionsSection ? truncateText(emissionsSection.content) : "VCU calculations pending"}
                </p>
                {emissionsSection && (
                  <Button 
                    variant="ghost" 
                    className="text-primary-600 hover:text-primary-700 p-0 h-auto flex items-center"
                    onClick={() => navigateToSection('4.3')}
                  >
                    Read more <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {showTemplate && (
          <Card className="mb-6 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-primary-600">VCS Project Description Template Requirements</CardTitle>
              <CardDescription>
                Standard sections required in carbon project documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-gray-700">1. PROJECT DETAILS</h3>
                <p className="text-gray-600 italic">
                  This section should include a summary description of the project, sectoral scope and project type, 
                  project eligibility, project design, project proponent, and other entities involved in the project.
                </p>
                
                <h3 className="text-gray-700 mt-4">2. SAFEGUARDS AND STAKEHOLDER ENGAGEMENT</h3>
                <p className="text-gray-600 italic">
                  This section should include information about stakeholder engagement and consultation, 
                  and risks to stakeholders and the environment.
                </p>
                
                <h3 className="text-gray-700 mt-4">3. APPLICATION OF METHODOLOGY</h3>
                <p className="text-gray-600 italic">
                  This section should include the title and reference of methodology, applicability of methodology, 
                  project boundary, baseline scenario, additionality, and methodology deviations.
                </p>
                
                <h3 className="text-gray-700 mt-4">4. QUANTIFICATION OF GHG EMISSION REDUCTIONS AND REMOVALS</h3>
                <p className="text-gray-600 italic">
                  This section should include baseline emissions, project emissions, leakage, and net GHG emission reductions and removals.
                </p>
                
                <h3 className="text-gray-700 mt-4">5. MONITORING</h3>
                <p className="text-gray-600 italic">
                  This section should include data and parameters available at validation, 
                  data and parameters monitored, and monitoring plan.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Sections</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="text-sm">
                  {generatedDocument.sections.map(section => renderSection(section))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-9">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-primary-500 mr-2" />
                    <CardTitle className="text-xl">
                      {activeSection.indexOf('.') === -1 
                        ? `${activeSection} ${findSectionById(generatedDocument.sections, activeSection)?.title || "Document Content"}`
                        : `${activeContent?.id} ${activeContent?.title || "Document Content"}`}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    {!editMode && activeContent && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleEdit}
                        className="flex items-center"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                    {editMode && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancel}
                          className="flex items-center"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleSave}
                          className="flex items-center"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                      </>
                    )}
                    {!editMode && editedSections[activeSection] !== undefined && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRevertToOriginal}
                        className="flex items-center text-earth-600"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Revert to Original
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose max-w-none p-6">
                {editMode ? (
                  <TextArea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full min-h-[500px] p-4 font-normal"
                  />
                ) : (
                  getAllContent().length > 0 ? (
                    <div>{getAllContent()}</div>
                  ) : (
                    <p>Select a section to view content</p>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}