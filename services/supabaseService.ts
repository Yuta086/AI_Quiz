import { SupabaseClient } from '@supabase/supabase-js';
import { User, Project, Submission, Attempt, Question } from '../types';

type SupabaseQuestion = Omit<Question, 'id'> & { project_id: string };

// --- User API ---
export const getUsers = async (client: SupabaseClient): Promise<User[]> => {
    const { data, error } = await client.from('users').select('*').order('name');
    if (error) throw new Error(error.message);
    return data || [];
};

export const addUser = async (client: SupabaseClient, userData: Omit<User, 'id'>): Promise<User> => {
    const { data, error } = await client.from('users').insert(userData).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const updateUser = async (client: SupabaseClient, id: string, userData: Partial<Omit<User, 'id'>>): Promise<User> => {
    const { data, error } = await client.from('users').update(userData).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const deleteUser = async (client: SupabaseClient, id: string): Promise<void> => {
    const { error } = await client.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

export const replaceUsers = async (client: SupabaseClient, usersData: Omit<User, 'id'>[]): Promise<User[]> => {
    // A bit risky, but simplest way to replace all.
    // In a real app, you might use an RPC function in Supabase.
    const { error: deleteError } = await client.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (deleteError) throw new Error(deleteError.message);
    
    const { data, error: insertError } = await client.from('users').insert(usersData).select();
    if (insertError) throw new Error(insertError.message);
    
    return data || [];
};

// --- Project API ---
export const getProjects = async (client: SupabaseClient): Promise<Project[]> => {
    const { data, error } = await client.from('projects').select('*, questions(*)').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Project[]) || [];
};

export const getProjectById = async (client: SupabaseClient, id: string): Promise<Project | null> => {
    const { data, error } = await client.from('projects').select('*, questions(*)').eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(error.message);
    }
    return data as Project || null;
};

export const addProject = async (client: SupabaseClient, projectData: Omit<Project, 'id' | 'createdAt' | 'questions'> & { questions: Omit<Question, 'id'>[] }): Promise<Project> => {
    const { questions, ...baseProjectData } = projectData;
    
    // 1. Create the project
    const { data: newProject, error: projectError } = await client.from('projects').insert(baseProjectData).select().single();
    if (projectError) throw new Error(projectError.message);
    if (!newProject) throw new Error("Project creation failed.");
    
    // 2. Add questions associated with the new project
    if (questions && questions.length > 0) {
        const questionsToInsert = questions.map(q => ({
            ...q,
            project_id: newProject.id
        }));
        const { error: questionsError } = await client.from('questions').insert(questionsToInsert);
        if (questionsError) throw new Error(questionsError.message);
    }
    
    // 3. Fetch the full project with questions to return
    return (await getProjectById(client, newProject.id))!;
};

export const updateProject = async (client: SupabaseClient, id: string, projectData: Omit<Partial<Project>, 'questions'> & { questions?: Omit<Question, 'id'>[] }): Promise<Project> => {
    const { questions, ...baseProjectData } = projectData;

    // 1. Update the base project info
    if (Object.keys(baseProjectData).length > 0) {
        const { error: projectError } = await client.from('projects').update(baseProjectData).eq('id', id);
        if (projectError) throw new Error(projectError.message);
    }

    // 2. Update questions (delete all existing and insert new ones)
    if (questions) {
        const { error: deleteError } = await client.from('questions').delete().eq('project_id', id);
        if (deleteError) throw new Error(deleteError.message);

        if (questions.length > 0) {
            const questionsToInsert = questions.map(q => ({
                ...q,
                project_id: id
            }));
            const { error: insertError } = await client.from('questions').insert(questionsToInsert);
            if (insertError) throw new Error(insertError.message);
        }
    }

    // 3. Fetch the full project to return
    return (await getProjectById(client, id))!;
};

export const deleteProject = async (client: SupabaseClient, id: string): Promise<void> => {
    // ON DELETE CASCADE in SQL schema will handle deleting associated questions, submissions, etc.
    const { error } = await client.from('projects').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

// --- Submission API ---
export const getSubmissions = async (client: SupabaseClient): Promise<Submission[]> => {
    const { data, error } = await client.from('submissions').select('*');
    if (error) throw new Error(error.message);
    return data || [];
};

export const addSubmission = async (client: SupabaseClient, submissionData: Omit<Submission, 'id'>): Promise<Submission> => {
    const { data, error } = await client.from('submissions').insert(submissionData).select().single();
    if (error) throw new Error(error.message);
    return data;
};

// --- Attempt API ---
export const getAttempts = async (client: SupabaseClient): Promise<Attempt[]> => {
    const { data, error } = await client.from('attempts').select('*');
    if (error) throw new Error(error.message);
    return data || [];
};

export const addAttempt = async (client: SupabaseClient, attemptData: Omit<Attempt, 'id'>): Promise<Attempt> => {
    const { data, error } = await client.from('attempts').insert(attemptData).select().single();
    if (error) throw new Error(error.message);
    return data;
};
