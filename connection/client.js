const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const pidusage = require('pidusage');
const os = require('os');
//const diskusage = require('diskusage');
const net = require('net');
const psListPromise = import('ps-list');
const cpu = require('windows-cpu');
const fs = require('fs');





// InfluxDB connection parameters
const token = 'nQKYVs13fHJFSFsUjcRPyiWqXoR1IcE4lSPYHG1jEAWnZ07VNWSPGuJZqI9t1wJ-wX0OaM7aJzpYbfvcA7p21Q==';
const org = 'CDAC';
const bucketName = 'network';

const client = new InfluxDB({
  url: 'http://localhost:8086',
  token: token,
});

const writeCpuUsage = async (socket) => {
    
  try {
    const stats = await pidusage(process.pid);
    const cpuUsagePercentage = stats.cpu / os.cpus().length;

    const cpuUsagePoint = new Point('cpu_usage')
      .tag('host', os.hostname())
      .floatField('value', cpuUsagePercentage);

    socket.write(JSON.stringify(cpuUsagePoint) + '\n');
    console.log('Writing CPU usage to server:', cpuUsagePoint);
  } catch (error) {
    console.error('Error fetching CPU usage:', error);
  }
};

const writeFreeMemory = async (socket) => {
  try {
    const freeMemory = os.freemem();
    console.log('Free Memory:', freeMemory);

    const freeMemoryPoint = new Point('free_memory')
      .tag('host', os.hostname())
      .floatField('value', freeMemory);

    socket.write(JSON.stringify(freeMemoryPoint) + '\n');
    console.log('Writing free memory to server:', freeMemoryPoint);
  } catch (error) {
    console.error('Error fetching free memory:', error);
  }
};let previousNetworkStats = {}; // Define and initialize previousNetworkStats as an empty object


const writeProcesses = async (socket) => {
  try {
    // Wait for psListPromise to resolve and assign its value to psList
    const { default: psList } = await psListPromise;

    // Call psList function to get the list of processes
    const processes = await psList();
    
    // Count the number of processes
    const processCount = processes.length;

    // Create a Point object to represent process count
    const processPoint = new Point('processes')
      .tag('host', os.hostname())
      .intField('value', processCount); // Use intField for integer values

    // Write the process count to the server
    socket.write(JSON.stringify(processPoint) + '\n');
    console.log('Writing process count to server:', processPoint);
  } catch (error) {
    // Handle any errors that occur during the psListPromise or psList call
    console.error('Error fetching process list:', error);
  }
};

const writeCpuLoad = async (socket) => {
  try {
    // Get CPU load average for the past 1 minute
    const cpuLoad = os.loadavg()[0]; // 1 minute load average

    // Create a JSON object with the CPU load
    const cpuLoadData = {
      tags: { host: os.hostname() },
      fields: { value: cpuLoad },
      name: 'cpu_load'
    };

    // Send CPU load data to the server
    socket.write(JSON.stringify(cpuLoadData) + '\n');
    console.log('Writing CPU load to server:', cpuLoadData);
  } catch (error) {
    console.error('Error fetching CPU load:', error);
  }
};
const si = require('systeminformation');


function getMemoryUsage() {
  const totalMemory = os.totalmem() / (1024 ** 2); // Convert to MB
  const freeMemory = os.freemem() / (1024 ** 2); // Convert to MB
  const usedMemory = totalMemory - freeMemory;

  return { usedMemory };
}

// Connect to the server
const SERVER_PORT = 4002;
const SERVER_HOST = '192.168.43.8'; // Replace with your server's IP address
const socket = new net.Socket();

socket.connect(SERVER_PORT, SERVER_HOST, () => {
  console.log('Connected to server');

});
const writeMemoryUsage = async (socket) => {
  try {
    const memoryUsageData = getMemoryUsage();

    // Check if the usedMemory property is present and not undefined
    if (memoryUsageData.usedMemory !== undefined) {
      const memoryUsagePoint = new Point('memory_usage')
        .tag('host', os.hostname())
        .floatField('value', memoryUsageData.usedMemory);

      socket.write(JSON.stringify(memoryUsagePoint) + '\n');
      console.log('Writing memory usage to server:', memoryUsagePoint);
    } else {
      console.error('Invalid memory usage data:', memoryUsageData);
    }
  } catch (error) {
    console.error('Error writing memory usage to server:', error);
  }
};



const memoryUsage = getMemoryUsage();
  socket.write(JSON.stringify({ type: 'memory_usage', data: memoryUsage }) + '\n');
  console.log('Memory usage data sent to server:', memoryUsage);
 
//});

// Handle errors
socket.on('error', error => {
  console.error('Socket error:', error);
});
// Run the functions every minute (adjust the interval as needed)
setInterval(() => {
   writeCpuUsage(socket);
 writeFreeMemory(socket);
 writeCpuLoad(socket);
  writeProcesses(socket);
 writeMemoryUsage(socket);
}, 3 * 1000); 
