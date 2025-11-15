import { SupabaseClient } from '@supabase/supabase-js';
import { User, Project, Submission, Attempt, Question } from '../types';

type SupabaseQuestion = Omit<Question, 'id'> & { project_id: string };

export interface ReplaceUsersResult {
    users: User[];
    message: string;
}

// --- Data Mapping Helpers ---

const mapProjectFromDb = (dbProject: any): Project => {
    if (!dbProject) return dbProject;
    const { created_at, ...rest } = dbProject;
    return {
        ...rest,
        createdAt: created_at,
        // Ensure questions are present and correctly typed
        questions: dbProject.questions || [],
    } as Project;
};

const mapSubmissionFromDb = (dbSubmission: any): Submission => {
    if (!dbSubmission) return dbSubmission;
    const { project_id, user_id, submitted_at, ...rest } = dbSubmission;
    return {
        ...rest,
        projectId: project_id,
        userId: user_id,
        submittedAt: submitted_at,
    } as Submission;
};

const mapAttemptFromDb = (dbAttempt: any): Attempt => {
    if (!dbAttempt) return dbAttempt;
    const { project_id, user_id, attempted_at, ...rest } = dbAttempt;
    return {
        ...rest,
        projectId: project_id,
        userId: user_id,
        attemptedAt: attempted_at,
    } as Attempt;
};


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
    // Check for submissions before deleting
    const { data: submissions, error: submissionError } = await client
        .from('submissions')
        .select('id')
        .eq('user_id', id)
        .limit(1);

    if (submissionError) throw new Error(submissionError.message);
    if (submissions && submissions.length > 0) {
        throw new Error("提出記録があるため、このユーザーは削除できません。");
    }

    const { error } = await client.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

export const replaceUsers = async (client: SupabaseClient, usersData: Omit<User, 'id'>[]): Promise<ReplaceUsersResult> => {
    const { data: existingUsers, error: fetchUsersError } = await client.from('users').select('id, name');
    if (fetchUsersError) throw new Error(fetchUsersError.message);

    const { data: submissions, error: fetchSubmissionsError } = await client.from('submissions').select('user_id');
    if (fetchSubmissionsError) throw new Error(fetchSubmissionsError.message);
    
    const submittedUserIds = new Set(submissions.map(s => s.user_id));
    const newNames = new Set(usersData.map(u => u.name.trim()));
    const existingUsersMap = new Map(existingUsers.map(u => [u.name.trim(), u.id]));

    // Users to delete: in DB, not in new list
    const usersToDelete = existingUsers.filter(u => !newNames.has(u.name.trim()));

    let deletedCount = 0;
    let protectedCount = 0;
    
    const deletableUserIds: string[] = [];
    for (const user of usersToDelete) {
        if (submittedUserIds.has(user.id)) {
            protectedCount++;
        } else {
            deletableUserIds.push(user.id);
        }
    }

    if (deletableUserIds.length > 0) {
        const { error: deleteError } = await client.from('users').delete().in('id', deletableUserIds);
        if (deleteError) throw new Error(deleteError.message);
        deletedCount = deletableUserIds.length;
    }

    // Users to add: in new list, not in DB
    const usersToAdd = usersData.filter(u => !existingUsersMap.has(u.name.trim()));

    if (usersToAdd.length > 0) {
        const { error: insertError } = await client.from('users').insert(usersToAdd);
        if (insertError) throw new Error(insertError.message);
    }

    // Get the final list of users
    const { data: finalUsers, error: finalFetchError } = await client.from('users').select('*').order('name');
    if (finalFetchError) throw new Error(finalFetchError.message);

    let message = `${usersToAdd.length}人のユーザーを追加し、${deletedCount}人のユーザーを削除しました。`;
    if (protectedCount > 0) {
        message += `\n提出記録がある${protectedCount}人のユーザーは削除されませんでした。`;
    }

    return { users: finalUsers || [], message };
};

// --- Project API ---
export const getProjects = async (client: SupabaseClient): Promise<Project[]> => {
    const { data, error } = await client.from('projects').select('*, questions(*)').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data?.map(mapProjectFromDb) || [];
};

export const getProjectById = async (client: SupabaseClient, id: string): Promise<Project | null> => {
    const { data, error } = await client.from('projects').select('*, questions(*)').eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(error.message);
    }
    return mapProjectFromDb(data);
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
    return data?.map(mapSubmissionFromDb) || [];
};

export const addSubmission = async (client: SupabaseClient, submissionData: Omit<Submission, 'id'>): Promise<Submission> => {
    const { projectId, userId, submittedAt, attempt_count } = submissionData;
    const dbData = {
        project_id: projectId,
        user_id: userId,
        submitted_at: submittedAt,
        attempt_count: attempt_count
    };
    const { data, error } = await client.from('submissions').insert(dbData).select().single();
    if (error) throw new Error(error.message);
    return mapSubmissionFromDb(data);
};

// --- Attempt API ---
export const getAttempts = async (client: SupabaseClient): Promise<Attempt[]> => {
    const { data, error } = await client.from('attempts').select('*');
    if (error) throw new Error(error.message);
    return data?.map(mapAttemptFromDb) || [];
};

export const addAttempt = async (client: SupabaseClient, attemptData: Omit<Attempt, 'id'>): Promise<Attempt> => {
    const { projectId, userId, score, attemptedAt } = attemptData;
     const dbData = {
        project_id: projectId,
        user_id: userId,
        score: score,
        attempted_at: attemptedAt
    };
    const { data, error } = await client.from('attempts').insert(dbData).select().single();
    if (error) throw new Error(error.message);
    return mapAttemptFromDb(data);
};
