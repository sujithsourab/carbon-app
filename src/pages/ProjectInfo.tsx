import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Upload, ClipboardList } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { TextArea } from "../components/ui/TextArea";
import { Select } from "../components/ui/Select";
import { useProject } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";
import { AppRoutes, ProjectInfo as IProjectInfo } from "../types";
import { cloudflareClient } from "../utils/cloudflare";

type ProjectFormData = Omit<IProjectInfo, "id" | "documents"> & {
  projectApproach?: string;
};

const methodologyOptions = [
  { value: "VM0047", label: "VM0047 - ARR Carbon Projects" },
  { value: "AR-ACM0003", label: "AR-ACM0003 - Afforestation Reforestation of Lands" },
];

const projectTypeOptions = [
  { value: "afforestation", label: "Afforestation" },
  { value: "reforestation", label: "Reforestation" },
  { value: "revegetation", label: "Revegetation" },
];

const projectApproachOptions = [
  { value: "census", label: "Census based Approach" },
  { value: "area", label: "Area based Approach" },
  { value: "both", label: "Both CbA and AbA" },
];

const projectStageOptions = [
  { value: "pre-feasibility", label: "Pre-feasibility" },
  { value: "feasibility", label: "Feasibility" },
  { value: "first-activity-started", label: "First Activity Started" },
  { value: "listed", label: "Listed" },
  { value: "under-validation", label: "Project under validation" },
  { value: "registered", label: "Project Registered" },
  { value: "verification-pending", label: "Verification pending" },
  { value: "requested-for-issuance", label: "Project requested for Issuance" },
  { value: "issued-credits", label: "Project Issued Credits" },
];

const standardOptions = [
  { value: "VCS", label: "VCS" },
  { value: "VCS+CCB", label: "VCS+CCB" },
  { value: "VCS+CCB+ABACUS", label: "VCS+CCB+ABACUS" },
];

interface FileStatus {
  file: File;
  status: 'uploading' | 'processing' | 'done' | 'error';
  error?: string;
  text?: string;
}

export function ProjectInfo() {
  const { projectInfo, saveProjectInfo } = useProject();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<FileStatus[]>([]);
  const [trainingDocs, setTrainingDocs] = useState<FileStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProjectFormData>({
    defaultValues: projectInfo || {
      name: "",
      location: "",
      startDate: "",
      endDate: "",
      methodology: "VM0047",
      projectType: "",
      projectApproach: "",
      projectStage: "pre-feasibility",
      description: "",
      standard: "VCS",
    },
  });

  const startDate = watch('startDate');
  const methodology = watch('methodology');
  const showProjectApproach = methodology === 'VM0047';

  React.useEffect(() => {
    if (projectInfo) {
      reset(projectInfo);
    }
  }, [projectInfo, reset]);

  const processFile = async (file: File, isTraining: boolean) => {
    try {
      if (!user?.id) {
        throw new Error('User must be authenticated to upload files');
      }

      // Update file status to uploading
      const fileStatus: FileStatus = {
        file,
        status: 'uploading'
      };

      if (isTraining) {
        setTrainingDocs(prev => [...prev.filter(f => f.file !== file), fileStatus]);
      } else {
        setUploadedFiles(prev => [...prev.filter(f => f.file !== file), fileStatus]);
      }

      // Upload to Supabase storage with owner metadata
      const uploadResult = await cloudflareClient.uploadFile(file);

      // Update status to processing
      const processingStatus: FileStatus = {
        file,
        status: 'processing'
      };

      if (isTraining) {
        setTrainingDocs(prev => [...prev.filter(f => f.file !== file), processingStatus]);
      } else {
        setUploadedFiles(prev => [...prev.filter(f => f.file !== file), processingStatus]);
      }

      // Extract text content
      const extractResult = await cloudflareClient.extractDocument(uploadResult.path);

      // Update file status to done
      const completedStatus: FileStatus = {
        file,
        status: 'done',
        text: extractResult.text
      };

      if (isTraining) {
        setTrainingDocs(prev => [...prev.filter(f => f.file !== file), completedStatus]);
      } else {
        setUploadedFiles(prev => [...prev.filter(f => f.file !== file), completedStatus]);
      }

      // Update extracted text
      setExtractedText(prev => prev + '\n\n' + extractResult.text);

    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error 
        ? `${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}`
        : 'Unknown error';

      const errorStatus: FileStatus = {
        file,
        status: 'error',
        error: errorMessage
      };

      if (isTraining) {
        setTrainingDocs(prev => [...prev.filter(f => f.file !== file), errorStatus]);
      } else {
        setUploadedFiles(prev => [...prev.filter(f => f.file !== file), errorStatus]);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isTraining: boolean = false) => {
    const files = Array.from(e.target.files || []);
    
    // Process each file
    for (const file of files) {
      await processFile(file, isTraining);
    }
  };

  const removeFile = (file: File, isTraining: boolean = false) => {
    if (isTraining) {
      setTrainingDocs(prev => prev.filter(f => f.file !== file));
    } else {
      setUploadedFiles(prev => prev.filter(f => f.file !== file));
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      setError(null);
      const projectData = {
        ...data,
        extractedText,
        documents: uploadedFiles.map(f => ({
          name: f.file.name,
          text: f.text || ''
        })),
        trainingDocuments: trainingDocs.map(f => ({
          name: f.file.name,
          text: f.text || ''
        }))
      };
      
      const savedProject = await saveProjectInfo(projectData);
      
      if (!savedProject) {
        setError("Unable to save project information. Please try again.");
        return;
      }

      navigate(AppRoutes.LOADING);
    } catch (error) {
      console.error('Error saving project:', error);
      setError("An error occurred while saving the project. Please try again.");
    }
  };

  // Calculate minimum end date based on start date
  const minEndDate = startDate ? new Date(startDate) : null;
  if (minEndDate) {
    minEndDate.setFullYear(minEndDate.getFullYear() + 40);
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-primary-50 to-earth-50 py-12 px-4 overflow-x-hidden">
      <div className="max-w-[2000px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700">Project Information</h1>
          <p className="mt-2 text-earth-700">
            {user?.isAnonymous
              ? "Enter your project details to generate standardized documentation"
              : `Welcome, ${user?.name || "Guest"}. Enter your project details below. Please fill the information carefully and it will be used for the AI to generate its  content`}
          </p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-primary-600">Project Details</CardTitle>
            <CardDescription>
              Please provide detailed information about your carbon project to generate accurate documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md">
                <p className="text-error-600">{error}</p>
              </div>
            )}
            <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Project Name"
                  placeholder="Enter project name"
                  error={errors.name?.message}
                  {...register("name", {
                    required: false,
                  })}
                />
                
                <Input
                  label="Project Location"
                  placeholder="City, State, Country"
                  error={errors.location?.message}
                  {...register("location", {
                    required: false,
                  })}
                />
                
                <Input
                  label="Project Start Date"
                  type="date"
                  error={errors.startDate?.message}
                  {...register("startDate", {
                    required: false,
                  })}
                />

                <Input
                  label="Project End Date"
                  type="date"
                  error={errors.endDate?.message}
                  min={minEndDate?.toISOString().split('T')[0]}
                  {...register("endDate", {
                    required: false,
                    validate: value => {
                      if (!startDate || !value) return true;
                      const start = new Date(startDate);
                      const end = new Date(value);
                      const minEnd = new Date(start);
                      minEnd.setFullYear(start.getFullYear() + 1);
                      return end >= minEnd || "End date must be at least 1 year after start date";
                    }
                  })}
                />
                
                <Select
                  label="Methodology"
                  options={methodologyOptions}
                  error={errors.methodology?.message}
                  {...register("methodology", {
                    required: false,
                  })}
                />
                
                <Select
                  label="Project Type"
                  options={projectTypeOptions}
                  error={errors.projectType?.message}
                  {...register("projectType", {
                    required: false,
                  })}
                />

                {showProjectApproach && (
                  <Select
                    label="Project Approach"
                    options={projectApproachOptions}
                    error={errors.projectApproach?.message}
                    {...register("projectApproach", {
                      required: false,
                    })}
                  />
                )}

                <Select
                  label="Standard and Label"
                  options={standardOptions}
                  error={errors.standard?.message}
                  {...register("standard", {
                    required: false,
                  })}
                />
                
                <Select
                  label="Project Stage"
                  options={projectStageOptions}
                  error={errors.projectStage?.message}
                  {...register("projectStage", {
                    required: false,
                  })}
                />
                
                <div className="md:col-span-2">
                  <TextArea
                    label="Project Description"
                    placeholder="Provide a detailed description of your project..."
                    rows={4}
                    error={errors.description?.message}
                    {...register("description", {
                      required: false,
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-dashed border-primary-300 rounded-lg p-6 bg-primary-50/30">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-8 w-8 text-primary-500" />
                    <h3 className="text-lg font-medium text-primary-700">Training Documents</h3>
                    <p className="text-sm text-primary-600 text-center">
                      Upload similar project documents to improve generation quality
                    </p>
                    <label htmlFor="training-upload" className="cursor-pointer">
                      <Input
                        id="training-upload"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, true)}
                      />
                      <div className="mt-2 inline-flex items-center px-4 py-2 border border-primary-500 text-primary-500 rounded-md hover:bg-primary-50 transition-colors">
                        Select Training Files
                      </div>
                    </label>
                  </div>
                  {trainingDocs.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-primary-700">Training Documents:</p>
                      <ul className="space-y-2">
                        {trainingDocs.map((fileStatus, index) => (
                          <li key={index} className="flex items-center justify-between bg-white/50 p-2 rounded-md">
                            <span className="text-sm text-primary-600">
                              {fileStatus.file.name}
                              {fileStatus.status === 'uploading' && ' (Uploading...)'}
                              {fileStatus.status === 'processing' && ' (Processing...)'}
                              {fileStatus.status === 'error' && ` (Error: ${fileStatus.error})`}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(fileStatus.file, true)}
                              className="text-error-500 hover:text-error-600 text-sm"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="border border-dashed border-earth-300 rounded-lg p-6 bg-earth-50/30">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-8 w-8 text-earth-500" />
                    <h3 className="text-lg font-medium text-earth-700">Supporting Documents</h3>
                    <p className="text-sm text-earth-600 text-center">
                      Upload additional documents to enhance the documentation
                    </p>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <div className="mt-2 inline-flex items-center px-4 py-2 border border-earth-500 text-earth-500 rounded-md hover:bg-earth-50 transition-colors">
                        Select Supporting Files
                      </div>
                    </label>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-earth-700">Supporting Documents:</p>
                      <ul className="space-y-2">
                        {uploadedFiles.map((fileStatus, index) => (
                          <li key={index} className="flex items-center justify-between bg-white/50 p-2 rounded-md">
                            <span className="text-sm text-earth-600">
                              {fileStatus.file.name}
                              {fileStatus.status === 'uploading' && ' (Uploading...)'}
                              {fileStatus.status === 'processing' && ' (Processing...)'}
                              {fileStatus.status === 'error' && ` (Error: ${fileStatus.error})`}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(fileStatus.file)}
                              className="text-error-500 hover:text-error-600 text-sm"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => navigate(AppRoutes.PORTFOLIO)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="project-form" 
              className="flex items-center"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}