import { MovieProvider } from "./model";
import { LocalMockProvider } from "./providers/localMock";
import { LocalBackendProvider } from "./providers/localBackend";
import { PhimApiProvider } from "./providers/phimapi";

export type ProviderName = "local" | "phimapi" | "kkphim";

const providers: Record<ProviderName, MovieProvider> = {
  local: new LocalBackendProvider(),
  phimapi: new LocalBackendProvider(), // Changed to use local backend
  kkphim: new LocalBackendProvider(), // Changed to use local backend
};

export const MovieService = {
  use(name: ProviderName = "local") {
    return providers[name];
  },
  
  async updateMovie(movieId: string, updateData: any, provider: ProviderName = "local"): Promise<any> {
    const providerInstance = providers[provider];
    if (providerInstance.updateMovie) {
      return await providerInstance.updateMovie(movieId, updateData);
    } else {
      throw new Error(`Update movie not supported for provider: ${provider}`);
    }
  }
};


