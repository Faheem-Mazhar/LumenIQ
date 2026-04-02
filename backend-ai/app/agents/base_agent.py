from abc import ABC, abstractmethod
from semantic_kernel import Kernel

# Base class for every agent to inherit from

class Agent(ABC):
    def __init__(self, kernel: Kernel, name: str):
        self.kernel = kernel
        self.name = name

    @abstractmethod
    async def run(self):
        pass

