import TangramPlay from 'app/TangramPlay';
import CodeMirror from 'codemirror';

CodeMirror.registerHelper('hint', 'yaml', function (editor, options) {
    if (TangramPlay.addons.suggestManager) {
        return TangramPlay.addons.suggestManager.hint(editor, options);
    }
    else {
        return {};
    }
});
