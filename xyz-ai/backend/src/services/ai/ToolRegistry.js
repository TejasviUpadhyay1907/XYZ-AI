/**
 * Tool Registry and Validation System
 * Manages tool definitions (JSON Schema) and input validation for AI orchestration.
 */

const { Validator } = require('jsonschema');
const v = new Validator();

class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a new tool
   * @param {Object} toolDefinition
   * @param {Function} handler - Async function to execute the tool
   */
  register(toolDefinition, handler) {
    if (!toolDefinition.name || !toolDefinition.schema) {
      throw new Error('Tool must have a name and a JSON schema');
    }

    this.tools.set(toolDefinition.name, {
      definition: toolDefinition,
      handler: handler
    });
  }

  /**
   * Get a tool by name
   */
  getTool(name) {
    return this.tools.get(name);
  }

  /**
   * Get all tool definitions (useful for passing to an LLM)
   */
  getAllDefinitions() {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  /**
   * Validate and execute a tool
   * @param {string} name - Tool name
   * @param {Object} args - Arguments to pass to the tool
   * @param {Object} context - Execution context (e.g., user info)
   */
  async execute(name, args, context) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    // Validate inputs against schema
    const validationResult = v.validate(args, tool.definition.schema);
    if (!validationResult.valid) {
      const errors = validationResult.errors.map(e => `${e.property} ${e.message}`).join(', ');
      throw new Error(`Invalid arguments for tool ${name}: ${errors}`);
    }

    // Execute handler
    try {
      return await tool.handler(args, context);
    } catch (error) {
      console.error(`[ToolRegistry] Error executing tool ${name}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new ToolRegistry();
