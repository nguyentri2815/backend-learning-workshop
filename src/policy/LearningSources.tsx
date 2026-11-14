import {createContext,useContext} from 'react';
import type {ReactNode} from 'react';
import sources from '../content/policy/assembly-source.json' with {type:'json'};
import {assemblySourceGuides} from '../content/policy/assembly-source-guide';
import type {SourceCatalog,SourceGuide} from './learning-contracts';

const defaults={sources:sources as SourceCatalog,guides:assemblySourceGuides as Record<string,SourceGuide>};
const SourceContext=createContext(defaults);
export function LearningSources({sources,guides,children}:{sources:SourceCatalog;guides:Record<string,SourceGuide>;children:ReactNode}){
 return <SourceContext.Provider value={{sources,guides}}>{children}</SourceContext.Provider>;
}
export function useLearningSources(){return useContext(SourceContext);}
export const creationSources=defaults;
