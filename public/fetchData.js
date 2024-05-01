// Fetch data from the server
fetch('/data')
    .then(response => response.json())
    .then(data => {
        const labels = data.map(item => item.date); // Assuming date field name is 'date'
        const values = data.map(item => item.value); // Assuming numerical value field name is 'value'

        // Render the chart
        renderChart(labels, values);
    })
    .catch(error => console.error('Error fetching data:', error));

// Function to render the chart
function renderChart(labels, values) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Data from Database',
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'day' // Adjust this based on your data
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Date'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Value'
                    },
                    ticks: {
                        beginAtZero: true // Start y-axis from 0
                    }
                }]
            }
        }
    });
}
