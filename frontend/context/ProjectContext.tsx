import React, { createContext, useContext, useState } from 'react';

type Project = {
  title: string;
  totalSteps: number;
  completedSteps: number[];
  progress: number;
  startedAt: string;
  lastUpdated: string;
};

type ProjectContextType = {
  projects: Project[];
  addProject: (project: Omit<Project, "progress" | "startedAt" | "lastUpdated">) => void;
  updateProjectProgress: (title: string, stepNumber: number) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);

  const addProject = (project: Omit<Project, "progress" | "startedAt" | "lastUpdated">) => {
    setProjects(current => {
      // Check if project already exists
      const exists = current.find(p => p.title === project.title);
      if (exists) return current;

      // Add new project
      return [...current, {
        ...project,
        progress: 0,
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      }];
    });
  };

  const updateProjectProgress = (title: string, stepNumber: number) => {
    setProjects(current => {
      return current.map(project => {
        if (project.title !== title) return project;

        const newCompletedSteps = Array.from(new Set([...project.completedSteps, stepNumber]));
        const progress = (newCompletedSteps.length / project.totalSteps) * 100;

        return {
          ...project,
          completedSteps: newCompletedSteps,
          progress,
          lastUpdated: new Date().toISOString(),
        };
      });
    });
  };

  return (
    <ProjectContext.Provider value={{ projects, addProject, updateProjectProgress }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
