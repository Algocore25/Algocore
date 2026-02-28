const fs = require('fs');

function updateConstraints(filename) {
    if (!fs.existsSync(filename)) return;

    let content = fs.readFileSync(filename, 'utf-8');
    let db;
    try {
        db = JSON.parse(content);
    } catch (e) {
        console.error("Failed to parse " + filename);
        return;
    }

    db.forEach(course => {
        if (!course.sections) return;

        Object.keys(course.sections).forEach(sectionKey => {
            const section = course.sections[sectionKey];
            if (!section.questions) return;

            section.questions.forEach(q => {
                if (q.type === 'Programming') {
                    let currentConstraints = q.constraints || [];

                    // We will standardize the constraints by adding realistic CP limits
                    const defaultConstraints = [
                        "Time Limit: 2.0 sec",
                        "Memory Limit: 256 MB"
                    ];

                    // If there's no existing constraints other than the basic ones, make sure it looks complete
                    // Or just merge them and deduplicate
                    const merged = [...currentConstraints, ...defaultConstraints];
                    q.constraints = [...new Set(merged)];
                }
            });
        });
    });

    fs.writeFileSync(filename, JSON.stringify(db, null, 2));
    console.log(`Updated constraints in ${filename}.`);
}

updateConstraints('java_questions.js');
