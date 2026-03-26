export const javaLesson9 = {
  id: 9,
  title: 'Multithreading & Concurrency',
  description: 'Running multiple processes at exactly the same time.',
  content: `
## Multithreading in Java

Multithreading allows concurrent execution of two or more parts of a program for maximum utilization of CPU.

### 1. Extending the Thread class
\`\`\`java
class MyThread extends Thread {
    public void run() {
        System.out.println("Thread is running!");
    }
}

public class Main {
    public static void main(String[] args) {
        MyThread t1 = new MyThread();
        t1.start(); // Invokes the run() method on a separate call stack!
    }
}
\`\`\`

### 2. Implementing the Runnable Interface
Most preferred way because Java doesn't support multiple inheritance of classes, meaning you can implement Runnable and still extend another core class!

<COMPILER>
class Counter extends Thread {
    private String name;
    
    public Counter(String name) {
        this.name = name;
    }
    
    public void run() {
        for (int i = 1; i <= 3; i++) {
            System.out.println(name + " - " + i);
            try {
                Thread.sleep(500); // Sleep for 500ms
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

class ThreadDemo {
    public static void main(String[] args) {
        Counter t1 = new Counter("Thread-1");
        Counter t2 = new Counter("Thread-2");
        
        t1.start();
        t2.start();
    }
}
</COMPILER>

### The \`synchronized\` Keyword
When threads share resources, they can corrupt data. Synchronization restricts resource access strictly to one thread at a time.
\`\`\`java
class Counter {
    private int count = 0;
    
    // Only one thread can execute this method at a time
    public synchronized void increment() {
        count++;
    }
}
\`\`\`
`
};