import get from 'lodash/get';
import { parse } from 'esprima';
import evaluate from 'static-eval';
import logger from './logger';

const log = logger('evaluateExpression');

const evaluateExpression = (src, context) => {
    if (!src || typeof context !== 'object') {
        return;
    }

    try {
        const ast = parse(src).body[0].expression;

        if (ast.type === 'SequenceExpression') {
            ast.expressions.forEach((expr) => {
                if (get(expr, 'left.type') === 'Identifier') {
                    const name = get(expr, 'left.name') || '';
                    if (name) {
                        const value = evaluate(expr.right, context);
                        context[name] = value;
                    }
                }
            });
        } else if (ast.type === 'AssignmentExpression') {
            const expr = ast;
            if (get(expr, 'left.type') === 'Identifier') {
                const name = get(expr, 'left.name') || '';
                if (name) {
                    const value = evaluate(expr.right, context);
                    context[name] = value;
                }
            }
        }
    } catch (e) {
        log.error(`evaluateExpression: src="${src}", context=${JSON.stringify(context)}`);
        log.error(e);
    }
};

export default evaluateExpression;
