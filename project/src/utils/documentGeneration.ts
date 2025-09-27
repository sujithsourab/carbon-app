import { Configuration, OpenAIApi } from 'openai';
import { supabase } from './supabase';
import { ProjectInfo, DocumentSection } from '../types';

const openai = new OpenAIApi(
  new Configuration({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  })
);

export async function generateDocumentContent(projectInfo: ProjectInfo): Promise<DocumentSection[]> {
  try {
    // Fetch relevant templates and training documents
    const { data: templates } = await supabase
      .from('document_templates')
      .select('*')
      .limit(1);

    if (!templates?.length) {
      throw new Error('No templates found');
    }

    const template = templates[0];

    // Fetch similar training documents based on project type
    const { data: trainingDocs } = await supabase
      .from('training_documents')
      .select('*')
      .eq('template_id', template.id)
      .limit(5);

    // Generate embeddings for project description
    const descriptionEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: projectInfo.description,
    });

    // Combine template structure with AI-generated content
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert in carbon project documentation. Generate detailed content following the template structure while incorporating project-specific details."
        },
        {
          role: "user",
          content: JSON.stringify({
            template: template.content,
            projectInfo,
            trainingExamples: trainingDocs?.map(doc => doc.content) || [],
          })
        }
      ]
    });

    // Parse and structure the generated content
    const generatedContent = JSON.parse(completion.choices[0].message.content);
    return generatedContent.sections;

  } catch (error) {
    console.error('Error generating document content:', error);
    // Fallback to standard template if AI generation fails
    return generateStandardTemplate(projectInfo);
  }
}

function generateStandardTemplate(projectInfo: ProjectInfo): DocumentSection[] {
  // Implementation of the standard template generation
  // This serves as a fallback when AI generation fails
  return [
    {
      id: '1',
      title: 'PROJECT DETAILS',
      content: `${projectInfo.name} is a ${projectInfo.projectType} project located in ${projectInfo.location}.`,
      subsections: [
        {
          id: '1.1',
          title: 'Project Overview',
          content: projectInfo.description
        },
        // ... other standard sections
      ]
    }
    // ... other standard sections
  ];
}