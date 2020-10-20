// THREEJS objects resource tracker
export class ResourceTracker {

    // resources
    private resources: Set<any> = new Set();

    // track an resource
    track<T>(resource: T): T {
        if (Array.isArray(resource)) {
            return resource.map(res => this.track(res)) as any;
        }
        if ((resource as any).dispose) {
            this.resources.add(resource);
        }
        return resource;
    }

    // untrack an resource
    untrack(resource: any) {
        this.resources.delete(resource);
    }

    // dispose all resources
    dispose() {
        this.resources.forEach(resource => {
            resource.dispose();
        })
        this.resources.clear();
    }

}
